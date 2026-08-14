import { Router } from 'express';
import {
  getConsultation,
  listConsultationsByPatient,
  createConsultation,
  updateConsultation,
  completeConsultation,
} from '../controllers/opdController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/patient/:patientId', listConsultationsByPatient);
router.get('/:id', getConsultation);
router.post('/', createConsultation);
router.patch('/:id', updateConsultation);
router.post('/:id/complete', completeConsultation);

export default router;
