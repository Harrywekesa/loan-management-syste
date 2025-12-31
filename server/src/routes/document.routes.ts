import { Router } from 'express';
import { uploadDocument, getPendingDocuments, reviewDocument } from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Borrower
router.post('/upload', authenticate, upload.single('document'), uploadDocument);

// Admin
router.get('/pending', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), getPendingDocuments);
router.patch('/:id/review', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), reviewDocument);

export default router;
