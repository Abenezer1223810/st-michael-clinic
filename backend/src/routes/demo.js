import { Router } from 'express';
import { startDemo, resetDemo } from '../controllers/demoController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public endpoint: launches the guided demo from the login screen.
router.post('/start', startDemo);
// Resets demo data back to the original seed state (any signed-in role).
router.post('/reset', requireAuth, resetDemo);

export default router;
