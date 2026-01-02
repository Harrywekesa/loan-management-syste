import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import loanRoutes from './routes/loan.routes';
import walletRoutes from './routes/wallet.routes';
import adminRoutes from './routes/admin.routes';
import documentRoutes from './routes/document.routes';
import analyticsRoutes from './routes/analytics.routes'; // New Import

const app: Express = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173' // Explicitly allow frontend origin
}));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "http://localhost:3000", "data:"], // Allow images from backend
            "script-src": ["'self'", "'unsafe-inline'"], // Allow inline scripts for React development
            "style-src": ["'self'", "https:", "'unsafe-inline'"], // Allow inline styles for Tailwind development
        },
    },
}));
app.use(morgan('dev'));

import { checkSystemSettings } from './middleware/settings.middleware';
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware';

app.use(checkSystemSettings); // Global Settings Check
app.use('/api', apiLimiter); // Global API Rate Limit

app.use('/api/auth', authLimiter, authRoutes); // Stricter Limit for Auth
app.use('/api/loans', loanRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analytics', analyticsRoutes); // Mount analytics routes
app.use('/uploads', express.static('uploads')); // Serve uploaded files statically

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

export default app;
