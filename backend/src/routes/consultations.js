import { Router } from 'express';
import {
  getConsultation,
  listConsultationsByPatient,
  createConsultation,
  updateConsultation,
  holdConsultationForLab,
  completeConsultation,
} from '../controllers/opdController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('doctor', 'administrator'));
router.get('/patient/:patientId', listConsultationsByPatient);
router.get('/:id', getConsultation);
router.post('/', createConsultation);
router.patch('/:id', updateConsultation);
router.put('/:id', updateConsultation);
router.post('/:id/hold-for-lab', holdConsultationForLab);
router.post('/:id/complete', completeConsultation);

export default router;
