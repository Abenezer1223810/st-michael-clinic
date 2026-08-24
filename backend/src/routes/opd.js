import { Router } from 'express';
import { getOpdQueue } from '../controllers/opdController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/queue', requireRole('doctor', 'administrator'), getOpdQueue);

export default router;
