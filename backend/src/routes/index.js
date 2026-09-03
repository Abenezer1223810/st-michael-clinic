import { Router } from 'express';
import authRoutes from './auth.js';
import patientRoutes from './patients.js';
import visitRoutes from './visits.js';
import queueRoutes from './queue.js';
import opdRoutes from './opd.js';
import consultationRoutes from './consultations.js';
import laboratoryRoutes from './laboratory.js';
import procedureRoutes from './procedures.js';
import injectionRoutes from './injections.js';
import prescriptionRoutes from './prescriptions.js';
import reportRoutes from './reports.js';
import dashboardRoutes from './dashboard.js';
import catalogRoutes from './catalog.js';
import adminRoutes from './admin.js';
import recycleBinRoutes from './recycleBin.js';
import billingRoutes from './billing.js';
import notificationRoutes from './notifications.js';
import devRoutes from './dev.js';
import demoRoutes from './demo.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/queue', queueRoutes);
router.use('/opd', opdRoutes);
router.use('/consultations', consultationRoutes);
router.use('/laboratory', laboratoryRoutes);
router.use('/procedures', procedureRoutes);
router.use('/injections', injectionRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/billing', billingRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/recycle-bin', recycleBinRoutes);
router.use('/dev', devRoutes);
router.use('/demo', demoRoutes);
// Catalog is mounted at the root with its own auth middleware, so it must stay last.
router.use('/', catalogRoutes);

export default router;
