import { Router } from 'express';
import {
  listSickLeaves,
  getSickLeave,
  createSickLeave,
} from '../controllers/sickLeaveController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const SL_READ = ['doctor', 'receptionist', 'administrator'];
const SL_WRITE = ['doctor', 'administrator'];

const router = Router();

router.use(requireAuth);
router.get('/', requireRole(...SL_READ), listSickLeaves);
router.post('/', requireRole(...SL_WRITE), createSickLeave);
router.get('/:id', requireRole(...SL_READ), getSickLeave);

export default router;
