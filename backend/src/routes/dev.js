import { Router } from 'express';
import { resetDemo } from '../controllers/devController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Development-only endpoint to restore the original demo state.
router.post('/reset', requireAuth, requireRole('administrator'), resetDemo);

export default router;
