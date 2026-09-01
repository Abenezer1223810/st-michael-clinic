import { Router } from 'express';
import { listVisits, getVisit, createVisit } from '../controllers/visitController.js';
import {
  getVisitClosureCheck,
  closeVisit,
  getVisitSummary,
} from '../controllers/visitClosureController.js';
import { db } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listVisits);
router.get('/:id', getVisit);
router.post('/', requireRole('receptionist', 'administrator'), createVisit);

// Phase 6: Visit Closure, Summary & Timeline
router.get('/:id/closure-check', getVisitClosureCheck);
router.post('/:id/close', requireRole('doctor', 'receptionist', 'administrator'), closeVisit);
router.get('/:id/summary', getVisitSummary);
router.get('/:id/timeline', async (req, res) => {
  try {
    const timeline = await db.getVisitTimeline(req.params.id);
    res.json(timeline);
  } catch (err) {
    res.status(404).json({ message: err.message || 'Visit timeline not found.' });
  }
});

export default router;
