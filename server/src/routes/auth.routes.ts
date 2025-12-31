import { Router } from 'express';
import { register, login, getProfile, verifyEmail } from '../controllers/auth.controller';
import { getPublicSettings } from '../controllers/admin.controller'; // Import
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/settings', getPublicSettings); // New Public Route
router.post('/register', register);
router.post('/verify-email', verifyEmail as any);
router.post('/login', login);
router.get('/me', authenticate, getProfile);

export default router;
