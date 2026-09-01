import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listRecycleBin, restoreItem, purgeItem, emptyBin } from '../controllers/recycleBinController.js';

const router = Router();

// All authenticated users can access the recycle bin (scoped to their own items for non-admins)
router.use(requireAuth);

router.get('/', listRecycleBin);
router.post('/:id/restore', restoreItem);
router.delete('/empty', emptyBin);
router.delete('/:id', purgeItem);

export default router;

