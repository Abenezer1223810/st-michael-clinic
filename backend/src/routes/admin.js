import { Router } from 'express';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('administrator'));

router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
