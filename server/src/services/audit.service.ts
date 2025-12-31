import prisma from '../utils/prisma';

export class AuditService {
    static async log(actorId: string, action: string, details?: string, ipAddress?: string) {
        try {
            await prisma.auditLog.create({
                data: {
                    actorId,
                    action,
                    details,
                    ipAddress
                }
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }
}
