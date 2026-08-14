import { Router } from 'express';
import {
  listPatients,
  getPatient,
  createPatient,
  getPatientHistory,
} from '../controllers/patientController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listPatients);
router.get('/:id/history', getPatientHistory);
router.get('/:id', getPatient);
router.post('/', createPatient);

export default router;
