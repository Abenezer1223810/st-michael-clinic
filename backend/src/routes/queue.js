import { Router } from 'express';
import {
  listQueue,
  addToQueue,
  updateQueueStatus,
} from '../controllers/queueController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listQueue);
router.post('/', requireRole('receptionist', 'administrator'), addToQueue);
router.patch('/:id/status', requireRole('receptionist', 'administrator'), updateQueueStatus);

export default router;
