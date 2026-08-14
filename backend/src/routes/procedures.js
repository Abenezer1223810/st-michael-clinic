import { Router } from 'express';
import {
  listProcedures,
  getProcedure,
  createProcedure,
  updateProcedureStatus,
  recordProcedure,
} from '../controllers/procedureController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listProcedures);
router.post('/', createProcedure);
router.get('/:id', getProcedure);
router.patch('/:id/status', updateProcedureStatus);
router.post('/:id/record', recordProcedure);

export default router;
