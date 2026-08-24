import { Router } from 'express';
import {
  listProcedures,
  getProcedure,
  createProcedure,
  updateProcedureStatus,
  recordProcedure,
} from '../controllers/procedureController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const CLINICAL = ['doctor', 'procedure', 'administrator'];
const PROC_WRITE = ['procedure', 'administrator'];

const router = Router();

router.use(requireAuth);
router.get('/', requireRole(...CLINICAL), listProcedures);
router.post('/', requireRole(...CLINICAL), createProcedure);
router.get('/:id', requireRole(...CLINICAL), getProcedure);
router.patch('/:id/status', requireRole(...PROC_WRITE), updateProcedureStatus);
router.post('/:id/record', requireRole(...PROC_WRITE), recordProcedure);

export default router;
