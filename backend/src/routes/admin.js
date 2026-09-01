import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listAuditLogs,
  listRecycleBin,
  restoreRecycleItem,
  purgeRecycleItem,
  emptyRecycleBin,
  listCatalog,
  listLabTests,
  createLabTest,
  updateLabTest,
  deleteLabTest,
  listMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  listProcedureTypes,
  createProcedureType,
  updateProcedureType,
  deleteProcedureType,
  listDepartments,
  createDepartment,
  deleteDepartment,
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('administrator'));

router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/audit-logs', listAuditLogs);

// Recycle Bin (30-day retention & restore)
router.get('/recycle-bin', listRecycleBin);
router.post('/recycle-bin/:id/restore', restoreRecycleItem);
router.delete('/recycle-bin/:id', purgeRecycleItem);
router.delete('/recycle-bin', emptyRecycleBin);

// Master Catalogs Management (Phase 6)
router.get('/catalog', listCatalog);

router.get('/catalog/lab-tests', listLabTests);
router.post('/catalog/lab-tests', createLabTest);
router.patch('/catalog/lab-tests/:id', updateLabTest);
router.delete('/catalog/lab-tests/:id', deleteLabTest);

router.get('/catalog/medicines', listMedicines);
router.post('/catalog/medicines', createMedicine);
router.patch('/catalog/medicines/:id', updateMedicine);
router.delete('/catalog/medicines/:id', deleteMedicine);

router.get('/catalog/procedure-types', listProcedureTypes);
router.post('/catalog/procedure-types', createProcedureType);
router.patch('/catalog/procedure-types/:id', updateProcedureType);
router.delete('/catalog/procedure-types/:id', deleteProcedureType);

router.get('/catalog/departments', listDepartments);
router.post('/catalog/departments', createDepartment);
router.delete('/catalog/departments/:name', deleteDepartment);

export default router;
