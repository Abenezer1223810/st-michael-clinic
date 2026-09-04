import { Router } from 'express';
import {
  listPatients,
  getPatient,
  createPatient,
  getPatientHistory,
  getPatientTimeline,
  renewCard,
} from '../controllers/patientController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listPatients);
router.get('/:id/history', getPatientHistory);
router.get('/:id/timeline', getPatientTimeline);
router.get('/:id', getPatient);
router.post('/', requireRole('receptionist', 'administrator'), createPatient);
router.post('/:id/renew-card', requireRole('receptionist', 'administrator'), renewCard);

export default router;
