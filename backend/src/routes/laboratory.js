import { Router } from 'express';
import {
  getTestCatalog,
  listRequests,
  getRequest,
  createRequest,
  getResult,
  enterResults,
  verifyResult,
  completeRequest,
} from '../controllers/laboratoryController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const CLINICAL = ['doctor', 'laboratory', 'administrator'];
const LAB_WRITE = ['laboratory', 'administrator'];

const router = Router();

router.use(requireAuth);
router.get('/tests', requireRole(...CLINICAL), getTestCatalog);
router.get('/requests', requireRole(...CLINICAL), listRequests);
router.post('/requests', requireRole(...CLINICAL), createRequest);
router.get('/requests/:id', requireRole(...CLINICAL), getRequest);
router.get('/requests/:id/result', requireRole(...CLINICAL), getResult);
router.post('/requests/:id/results', requireRole(...LAB_WRITE), enterResults);
router.post('/requests/:id/verify', requireRole(...LAB_WRITE), verifyResult);
router.post('/requests/:id/complete', requireRole(...LAB_WRITE), completeRequest);

export default router;
