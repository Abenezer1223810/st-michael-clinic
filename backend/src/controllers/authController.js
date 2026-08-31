import { signToken } from '../utils/token.js';
import { db } from '../db/index.js';

export const login = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  const user = await db.findUserByUsername(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }
  if (user.banned) {
    return res.status(403).json({ message: 'This account has been suspended. Contact your administrator.' });
  }
  const token = signToken({ id: user.id, role: user.role });
  const { password: _pw, ...safe } = user;
  res.json({ token, user: safe });
};

export const me = (req, res) => {
  const { password: _pw, ...safe } = req.user;
  res.json({ user: safe });
};
