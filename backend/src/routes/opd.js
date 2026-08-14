import { Router } from 'express';
import { getOpdQueue } from '../controllers/opdController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/queue', getOpdQueue);

export default router;
