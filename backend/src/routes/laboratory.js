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
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/tests', getTestCatalog);
router.get('/requests', listRequests);
router.post('/requests', createRequest);
router.get('/requests/:id', getRequest);
router.get('/requests/:id/result', getResult);
router.post('/requests/:id/results', enterResults);
router.post('/requests/:id/verify', verifyResult);
router.post('/requests/:id/complete', completeRequest);

export default router;
