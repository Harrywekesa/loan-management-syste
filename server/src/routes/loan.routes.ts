import { Router } from 'express';
import { getLoanProducts, createLoanProduct, calculateLoan, applyLoan, getMyLoans } from '../controllers/loan.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public / Borrower
router.get('/products', getLoanProducts);
router.post('/calculate', calculateLoan); // Public for calculator
router.post('/apply', authenticate, applyLoan);
router.get('/my', authenticate, getMyLoans);

// Admin
router.post('/products', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), createLoanProduct);

export default router;
