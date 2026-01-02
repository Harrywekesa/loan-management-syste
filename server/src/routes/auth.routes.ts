import { Router } from 'express';
import { register, login, getProfile, verifyEmail } from '../controllers/auth.controller';
import { getPublicSettings } from '../controllers/admin.controller'; // Import
import { authenticate } from '../middleware/auth.middleware';

// 1. Import upload middleware
import { upload } from '../middleware/upload.middleware';
import { updateProfile } from '../controllers/auth.controller'; // Import updateProfile

const router = Router();

router.get('/settings', getPublicSettings);
router.post('/register', upload.fields([{ name: 'idFront', maxCount: 1 }, { name: 'idBack', maxCount: 1 }]), register);
router.post('/verify-email', verifyEmail as any);
router.post('/login', login);
router.get('/me', authenticate, getProfile);
router.patch('/me', authenticate, upload.single('profilePicture'), updateProfile); // New Route for Profile Update


export default router;
