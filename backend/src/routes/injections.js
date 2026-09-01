import { Router } from 'express';
import {
  listInjectionOrders,
  getInjectionOrder,
  createInjectionOrder,
  administerInjection,
} from '../controllers/injectionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const CLINICAL_READ = ['doctor', 'procedure', 'nurse', 'administrator', 'receptionist'];
const DOCTOR_WRITE = ['doctor', 'administrator'];
const NURSE_WRITE = ['procedure', 'nurse', 'administrator'];

const router = Router();

router.use(requireAuth);
router.get('/', requireRole(...CLINICAL_READ), listInjectionOrders);
router.post('/', requireRole(...DOCTOR_WRITE), createInjectionOrder);
router.get('/:id', requireRole(...CLINICAL_READ), getInjectionOrder);
router.post('/:id/administer', requireRole(...NURSE_WRITE), administerInjection);

export default router;

