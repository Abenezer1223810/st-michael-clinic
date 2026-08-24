import { Router } from 'express';
import {
  listPrescriptions,
  getPrescription,
  createPrescription,
} from '../controllers/prescriptionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('doctor', 'administrator'));
router.get('/', listPrescriptions);
router.post('/', createPrescription);
router.get('/:id', getPrescription);

export default router;
