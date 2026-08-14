import { Router } from 'express';
import {
  dailyPatientReport,
  opdReport,
  laboratoryReport,
  procedureReport,
  prescriptionReport,
} from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/daily-patients', dailyPatientReport);
router.get('/opd', opdReport);
router.get('/laboratory', laboratoryReport);
router.get('/procedures', procedureReport);
router.get('/prescriptions', prescriptionReport);

export default router;
