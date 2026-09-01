import { Router } from 'express';
import {
  dailyPatientReport,
  opdReport,
  laboratoryReport,
  procedureReport,
  prescriptionReport,
  revenueReport,
  labWorkloadReport,
  patientHistoryReport,
  visitSummaryReport,
} from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/daily-patients', dailyPatientReport);
router.get('/opd', opdReport);
router.get('/laboratory', laboratoryReport);
router.get('/procedures', procedureReport);
router.get('/prescriptions', prescriptionReport);

// Phase 6 Reporting
router.get('/revenue', revenueReport);
router.get('/lab-workload', labWorkloadReport);
router.get('/patient-history/:patientId', patientHistoryReport);
router.get('/visit-summary/:visitId', visitSummaryReport);

export default router;
