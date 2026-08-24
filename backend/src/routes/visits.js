import { Router } from 'express';
import { listVisits, getVisit, createVisit } from '../controllers/visitController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listVisits);
router.get('/:id', getVisit);
router.post('/', requireRole('receptionist', 'administrator'), createVisit);

export default router;
