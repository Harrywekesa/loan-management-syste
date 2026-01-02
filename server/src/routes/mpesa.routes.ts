
import { Router } from 'express';
import { handleStkCallback, handleB2cResult, handleB2cTimeout, handleBalanceResult } from '../controllers/mpesa.controller';

const router = Router();

router.post('/stk', handleStkCallback);
router.post('/b2c/result', handleB2cResult);
router.post('/b2c/timeout', handleB2cTimeout);
router.post('/balance/result', handleBalanceResult); // New Route
router.post('/balance/timeout', handleB2cTimeout); // Reuse timeout handler

export default router;
