import { Router } from 'express';
import {
  listQueue,
  addToQueue,
  updateQueueStatus,
} from '../controllers/queueController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listQueue);
router.post('/', addToQueue);
router.patch('/:id/status', updateQueueStatus);

export default router;
