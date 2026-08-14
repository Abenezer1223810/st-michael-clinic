import { signToken } from '../utils/token.js';
import { db } from '../data/store.js';

export const login = (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  const user = db.users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }
  const token = signToken({ id: user.id, role: user.role });
  const { password: _pw, ...safe } = user;
  res.json({ token, user: safe });
};

export const me = (req, res) => {
  const { password: _pw, ...safe } = req.user;
  res.json({ user: safe });
};
