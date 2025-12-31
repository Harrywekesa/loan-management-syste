import { Router } from 'express';
import { getAdminStats, getLoans, updateLoanStatus } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'SUPER_ADMIN']));

router.get('/stats', getAdminStats);
router.get('/loans', getLoans);
router.patch('/loans/:id', updateLoanStatus);

export default router;
