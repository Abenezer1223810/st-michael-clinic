import { db } from '../data/store.js';
import { nextUserId } from '../utils/idGenerator.js';

const ROLES = ['administrator', 'receptionist', 'doctor', 'laboratory', 'procedure'];

function safeUser(u) {
  const { password: _pw, ...safe } = u;
  return safe;
}

export const listUsers = (_req, res) => {
  res.json({ users: db.users.map(safeUser) });
};

export const createUser = (req, res) => {
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
  const exists = db.users.some(
    (u) => u.username.toLowerCase() === String(username).trim().toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ message: 'That username is already taken. Choose another one.' });
  }

  const user = {
    id: nextUserId(),
    username: String(username).trim(),
    password: String(password),
    name: String(name).trim(),
    title: (title || '').trim() || ROLES[ROLES.indexOf(role)],
    role,
    banned: false,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  res.status(201).json({ user: safeUser(user), message: 'User account created successfully.' });
};

export const updateUser = (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
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
  if (banned === true) {
    const admins = db.users.filter((u) => u.role === 'administrator' && !u.banned);
    if (admins.length <= 1 && admins[0]?.id === user.id) {
      return res.status(400).json({ message: 'You cannot ban the last active administrator.' });
    }
  }

  if (name !== undefined) user.name = String(name).trim() || user.name;
  if (title !== undefined) user.title = String(title).trim() || user.title;
  if (role !== undefined) user.role = role;
  if (banned !== undefined) user.banned = banned === true;

  res.json({ user: safeUser(user), message: 'User account updated.' });
};

export const deleteUser = (req, res) => {
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: 'User account not found.' });
  }
  const user = db.users[idx];
  if (user.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }
  const admins = db.users.filter((u) => u.role === 'administrator' && !u.banned);
  if (user.role === 'administrator' && admins.length <= 1) {
    return res.status(400).json({ message: 'You cannot delete the last active administrator.' });
  }
  db.users.splice(idx, 1);
  res.json({ message: `User "${user.name}" has been removed.` });
};
