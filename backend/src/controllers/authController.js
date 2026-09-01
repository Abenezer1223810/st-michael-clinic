import { signToken } from '../utils/token.js';
import { db } from '../db/index.js';
import { comparePassword } from '../utils/password.js';

export const login = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = await db.findUserByUsername(username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const passwordValid = await comparePassword(password, user.password || user.passwordHash);
  if (!passwordValid) {
    await db.createAuditLog({
      userName: username,
      action: 'LOGIN_FAILED',
      entityType: 'USER',
      entityId: user.id,
      details: { reason: 'Incorrect password' },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
    });
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  if (user.banned || user.active === false) {
    return res.status(403).json({ message: 'This account has been suspended. Contact your administrator.' });
  }

  await db.createAuditLog({
    userId: user.id,
    userName: user.name,
    action: 'LOGIN_SUCCESS',
    entityType: 'USER',
    entityId: user.id,
    details: { role: user.role },
    ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
  });

  const token = signToken({ id: user.id, role: user.role });
  const { password: _pw, passwordHash: _ph, ...safe } = user;
  res.json({ token, user: safe });
};

export const me = (req, res) => {
  const { password: _pw, passwordHash: _ph, ...safe } = req.user;
  res.json({ user: safe });
};
