import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getAdminSummary, getLoansReport, getTransactionsReport, getAnalyticsTrends } from '../controllers/analytics.controller';

const router = Router();

// Admin-only routes
router.use(authenticate, authorize(['ADMIN', 'SUPER_ADMIN']));

router.get('/summary', getAdminSummary);
router.get('/loans', getLoansReport);
router.get('/transactions', getTransactionsReport);
router.get('/trends', getAnalyticsTrends);

export default router;
