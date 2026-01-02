import { Router } from 'express';
import {
    getAdminStats,
    getLoans,
    updateLoanStatus,
    getUsers,
    getUserDetails,
    updateUserStatus,
    getSettings,
    updateSettings,
    getAuditLogs,
    uploadFile
} from '../controllers/admin.controller';
import { getSummaryReport, getTrends } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'SUPER_ADMIN']));

router.get('/stats', getAdminStats);
router.get('/loans', getLoans);
router.patch('/loans/:id', updateLoanStatus);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id/status', updateUserStatus);

// System Settings
router.get('/settings', getSettings);
import { upload as settingsUpload } from '../middleware/upload.middleware';
router.post('/settings', settingsUpload.single('logo'), updateSettings);
router.get('/audit-logs', getAuditLogs);

// Uploads
import multer from 'multer';
import path from 'path';
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });
router.post('/upload', upload.single('file'), uploadFile);

// Loan Products
import { createLoanProduct, updateLoanProduct, getLoanProducts } from '../controllers/loan.controller';
router.get('/products', getLoanProducts);
router.post('/products', createLoanProduct);
router.patch('/products/:id', updateLoanProduct);

export default router;
