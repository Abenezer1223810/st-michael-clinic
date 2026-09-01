import { Router } from 'express';
import {
  listPrescriptions,
  getPrescription,
  createPrescription,
  dispensePrescription,
} from '../controllers/prescriptionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const RX_READ = ['doctor', 'pharmacy', 'receptionist', 'administrator'];
const DOCTOR_WRITE = ['doctor', 'administrator'];
const PHARMACY_WRITE = ['pharmacy', 'administrator'];

const router = Router();

router.use(requireAuth);
router.get('/', requireRole(...RX_READ), listPrescriptions);
router.post('/', requireRole(...DOCTOR_WRITE), createPrescription);
router.get('/:id', requireRole(...RX_READ), getPrescription);
router.post('/:id/dispense', requireRole(...PHARMACY_WRITE), dispensePrescription);

export default router;
