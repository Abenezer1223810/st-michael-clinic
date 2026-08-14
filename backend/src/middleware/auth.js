import { verifyToken } from '../utils/token.js';
import { db } from '../data/store.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ message: 'Unauthorized. Please log in again.' });
  }
  const user = db.users.find((u) => u.id === payload.id);
  if (!user) {
    return res.status(401).json({ message: 'User account not found.' });
  }
  req.user = user;
  next();
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
