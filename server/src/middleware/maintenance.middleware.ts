import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Skip for Admin routes or Login
        if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth')) {
            return next();
        }

        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'maintenance_mode' }
        });

        if (setting?.value === 'true') {
            return res.status(503).json({
                message: 'System is currently under maintenance. Please try again later.'
            });
        }

        next();
    } catch (error) {
        next();
    }
};
