
import { Router } from 'express';
import { handleStkCallback, handleB2cResult, handleB2cTimeout } from '../controllers/mpesa.controller';

const router = Router();

router.post('/stk', handleStkCallback);
router.post('/b2c/result', handleB2cResult);
router.post('/b2c/timeout', handleB2cTimeout);

export default router;
