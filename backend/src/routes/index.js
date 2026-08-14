import { Router } from 'express';
import authRoutes from './auth.js';
import patientRoutes from './patients.js';
import visitRoutes from './visits.js';
import queueRoutes from './queue.js';
import opdRoutes from './opd.js';
import consultationRoutes from './consultations.js';
import laboratoryRoutes from './laboratory.js';
import procedureRoutes from './procedures.js';
import prescriptionRoutes from './prescriptions.js';
import reportRoutes from './reports.js';
import dashboardRoutes from './dashboard.js';
import catalogRoutes from './catalog.js';
import devRoutes from './dev.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/queue', queueRoutes);
router.use('/opd', opdRoutes);
router.use('/consultations', consultationRoutes);
router.use('/laboratory', laboratoryRoutes);
router.use('/procedures', procedureRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/', catalogRoutes);
router.use('/dev', devRoutes);

export default router;
