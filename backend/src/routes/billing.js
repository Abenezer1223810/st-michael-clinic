import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as billingController from '../controllers/billingController.js';

const router = Router();

router.use(requireAuth);

router.get('/invoices', billingController.listInvoices);
router.get('/invoices/visit/:visitId', billingController.getVisitInvoice);
router.get('/invoices/:id', billingController.getInvoice);
router.get('/visit/:visitId', billingController.getVisitInvoice);

// Payment & Verification actions restricted to reception and administrators
router.post('/invoices/:id/payments', requireRole(['administrator', 'receptionist']), billingController.receivePayment);
router.post('/invoices/:id/verify', requireRole(['administrator', 'receptionist']), billingController.verifyPayment);
router.post('/payments/:id/cancel', requireRole(['administrator', 'receptionist']), billingController.cancelPayment);

export default router;

