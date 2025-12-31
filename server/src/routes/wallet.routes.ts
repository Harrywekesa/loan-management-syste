import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getWallet, withdraw } from '../controllers/wallet.controller';

const router = Router();

router.use(authenticate);

router.get('/', getWallet);
router.post('/withdraw', withdraw);

export default router;
