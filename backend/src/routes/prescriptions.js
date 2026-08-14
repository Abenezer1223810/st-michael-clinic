import { Router } from 'express';
import {
  listPrescriptions,
  getPrescription,
  createPrescription,
} from '../controllers/prescriptionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listPrescriptions);
router.post('/', createPrescription);
router.get('/:id', getPrescription);

export default router;
