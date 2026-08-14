import { Router } from 'express';
import { db } from '../data/store.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/medicines', (_req, res) => res.json({ medicines: db.medicines }));
router.get('/procedure-types', (_req, res) => res.json({ procedureTypes: db.procedureTypes }));
router.get('/departments', (_req, res) => res.json({ departments: db.departments }));
router.get('/users', requireRole('administrator'), (_req, res) =>
  res.json({ users: db.users.map(({ password, ...u }) => u) })
);

export default router;
