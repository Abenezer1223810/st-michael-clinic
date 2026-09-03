import { Router } from 'express';
import {
  getTestCatalog,
  listRequests,
  getRequest,
  createRequest,
  collectSample,
  getSample,
  listSamples,
  getResult,
  enterResults,
  verifyResult,
  releaseResultToDoctor,
  completeRequest,
  getLabRequestMessages,
  addLabRequestMessage,
} from '../controllers/laboratoryController.js';
import {
  listDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  ingestAnalyzerResults,
  runSimulator,
} from '../controllers/deviceController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const CLINICAL = ['doctor', 'laboratory', 'administrator'];
const LAB_WRITE = ['laboratory', 'administrator'];
const ADMIN_ONLY = ['administrator'];

const router = Router();

// Device machine ingestion & simulator (open to local analyzer network / simulator service)
router.post('/devices/ingest', ingestAnalyzerResults);
router.post('/analyzer-results', ingestAnalyzerResults);
router.post('/simulator/run', runSimulator);

router.use(requireAuth);

// Test catalog & request orders
router.get('/tests', requireRole(...CLINICAL), getTestCatalog);
router.get('/requests', requireRole(...CLINICAL), listRequests);
router.post('/requests', requireRole(...CLINICAL), createRequest);
router.get('/requests/:id', requireRole(...CLINICAL), getRequest);

// Sample collection & tracking
router.post('/requests/:id/sample', requireRole(...LAB_WRITE), collectSample);
router.get('/samples', requireRole(...CLINICAL), listSamples);
router.get('/samples/:id', requireRole(...CLINICAL), getSample);

// Result lifecycle
router.get('/requests/:id/result', requireRole(...CLINICAL), getResult);
router.post('/requests/:id/results', requireRole(...LAB_WRITE), enterResults);
router.post('/requests/:id/verify', requireRole(...LAB_WRITE), verifyResult);
router.post('/requests/:id/release', requireRole(...LAB_WRITE), releaseResultToDoctor);
router.post('/requests/:id/complete', requireRole(...LAB_WRITE), completeRequest);

// Doctor & Lab Communication Notes
router.get('/requests/:id/messages', requireRole(...CLINICAL), getLabRequestMessages);
router.post('/requests/:id/messages', requireRole(...CLINICAL), addLabRequestMessage);

// Device configuration management
router.get('/devices', requireRole(...CLINICAL), listDevices);
router.get('/devices/:id', requireRole(...CLINICAL), getDevice);
router.post('/devices', requireRole(...LAB_WRITE), createDevice);
router.patch('/devices/:id', requireRole(...LAB_WRITE), updateDevice);
router.delete('/devices/:id', requireRole(...ADMIN_ONLY), deleteDevice);

export default router;
