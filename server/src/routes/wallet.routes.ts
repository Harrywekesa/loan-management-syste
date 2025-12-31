import { Router } from 'express';
import { getWallet, withdraw } from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getWallet);
router.post('/withdraw', authenticate, withdraw);

export default router;
