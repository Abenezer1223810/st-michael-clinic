import { db } from '../db/index.js';

const ROLES = ['administrator', 'receptionist', 'doctor', 'laboratory', 'procedure'];

function safeUser(u) {
  if (!u) return null;
  const { password: _pw, ...safe } = u;
  return safe;
}

export const listUsers = async (_req, res) => {
  const users = await db.listUsers();
  res.json({ users: users.map(safeUser) });
};

export const createUser = async (req, res) => {
  const { name, username, title, role, password } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Full name is required.' });
  }
  if (!username || !String(username).trim()) {
    return res.status(400).json({ message: 'Username is required.' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: 'Please choose a valid role.' });
  }

  const existing = await db.findUserByUsername(username);
  if (existing) {
    return res.status(400).json({ message: 'That username is already taken. Choose another one.' });
  }

  const user = await db.createUser({
    name: String(name).trim(),
    username: String(username).trim(),
    title: (title || '').trim() || ROLES[ROLES.indexOf(role)],
    role,
    password: String(password),
  });

  res.status(201).json({ user: safeUser(user), message: 'User account created successfully.' });
};

export const updateUser = async (req, res) => {
  const user = await db.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User account not found.' });
  }

  const { name, title, role, banned } = req.body || {};

  if (role !== undefined && !ROLES.includes(role)) {
    return res.status(400).json({ message: 'Please choose a valid role.' });
  }
  if (req.user.id === user.id) {
    if (role && role !== user.role) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }
    if (banned === true) {
      return res.status(400).json({ message: 'You cannot ban your own account.' });
    }
  }

  const allUsers = await db.listUsers();
  if (banned === true) {
    const admins = allUsers.filter((u) => u.role === 'administrator' && !u.banned);
    if (admins.length <= 1 && admins[0]?.id === user.id) {
      return res.status(400).json({ message: 'You cannot ban the last active administrator.' });
    }
  }

  const updates = {};
  if (name !== undefined) updates.name = String(name).trim() || user.name;
  if (title !== undefined) updates.title = String(title).trim() || user.title;
  if (role !== undefined) updates.role = role;
  if (banned !== undefined) updates.banned = banned === true;

  const updated = await db.updateUser(req.params.id, updates);
  res.json({ user: safeUser(updated), message: 'User account updated.' });
};

export const deleteUser = async (req, res) => {
  const user = await db.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User account not found.' });
  }
  if (user.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }
  const allUsers = await db.listUsers();
  const admins = allUsers.filter((u) => u.role === 'administrator' && !u.banned);
  if (user.role === 'administrator' && admins.length <= 1) {
    return res.status(400).json({ message: 'You cannot delete the last active administrator.' });
  }

  await db.deleteUser(req.params.id);
  res.json({ message: `User "${user.name}" has been removed.` });
};
