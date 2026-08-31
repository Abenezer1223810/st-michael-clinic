import { verifyToken } from '../utils/token.js';
import { db } from '../db/index.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const payload = verifyToken(token);
    if (!payload || !payload.id) {
      return res.status(401).json({ message: 'Unauthorized. Please log in again.' });
    }
    const user = await db.findUserById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'User account not found.' });
    }
    if (user.banned) {
      return res.status(401).json({ message: 'This account has been suspended. Contact your administrator.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Authentication failed.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
}
