import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const checkSystemSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['maintenance_mode', 'allow_loans', 'allow_registration'] }
            }
        });

        const settingsMap = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Bypass for essential routes and Admin routes
        // We use a broader check to ensure all admin API calls and auth calls are allowed through
        // The individual routers (admin.routes, auth.routes) will handle authentication verification
        if (req.path.includes('/admin') || req.path.includes('/auth') || req.path.includes('/health')) {
            return next();
        }

        // 1. Check Maintenance Mode
        // Admin routes should bypass this, but for general user routes:
        if (settingsMap['maintenance_mode'] === 'true') {
            // Check if user is admin to bypass? 
            // For now, let's assume this middleware is applied to user-facing routes
            const user = (req as any).user;
            if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
                return res.status(503).json({ message: 'System is currently under maintenance. Please try again later.', maintenance: true });
            }
        }

        // 2. Check Specific Features based on path (Simple routing check)
        if (req.path.includes('/register') && settingsMap['allow_registration'] === 'false') {
            return res.status(403).json({ message: 'Registration is currently disabled.' });
        }

        if (req.path.includes('/apply') && settingsMap['allow_loans'] === 'false') {
            return res.status(403).json({ message: 'Loan applications are currently disabled.' });
        }

        next();
    } catch (error) {
        console.error('Settings check error', error);
        next(); // Proceed if check fails to avoid blocking system entirely on error
    }
};
