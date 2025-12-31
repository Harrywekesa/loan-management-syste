import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { CreditScoreService, CreditScoreRules } from '../services/creditScore.service';
import { AuditService } from '../services/audit.service';

// --- File Upload Handler ---
export const uploadFile = (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return the accessible URL of the uploaded file
    // Assuming 'uploads' is served statically or we return a relative path
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
};

export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const [users, loans, wallet] = await Promise.all([
            prisma.user.count(),
            prisma.loan.count({ where: { status: 'PENDING' } }), // Pending Loans count
            prisma.wallet.aggregate({ _sum: { balance: true } }) // Logic for system wallet placeholder
        ]);

        // In a real system, system wallet would be a specific account. 
        // Here we might just sum all user balances or mock a system balance.
        const systemBalance = 1000000;

        res.json({
            users,
            loans, // Pending loans
            walletBalance: systemBalance
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

export const getLoans = async (req: Request, res: Response) => {
    try {
        const loans = await prisma.loan.findMany({
            include: { user: { select: { fullName: true, email: true, idNumber: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching loans' });
    }
};

export const updateLoanStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reason } = req.body; // APPROVED, REJECTED + Reason

    try {
        const loan = await prisma.loan.findUnique({ where: { id } });
        if (!loan) return res.status(404).json({ message: 'Loan not found' });

        if (loan.status !== 'PENDING') {
            return res.status(400).json({ message: 'Loan is not pending' });
        }

        // Atomic update
        await prisma.$transaction(async (tx) => {
            // 1. Update Loan
            const updatedLoan = await tx.loan.update({
                where: { id },
                data: {
                    status,
                    rejectionReason: status === 'REJECTED' ? reason : null, // Save reason
                    disbursedAt: status === 'APPROVED' ? new Date() : null,
                    dueDate: status === 'APPROVED' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
                }
            });

            // 2. If Approved, Credit Wallet (Disbursement)
            if (status === 'APPROVED') {
                // Calculate Net Amount
                const netAmount = Number(loan.principal) - Number(loan.processingFee);

                // Credit User Wallet
                await tx.wallet.update({
                    where: { userId: loan.userId },
                    data: { balance: { increment: netAmount } }
                });

                // Create Transaction
                await tx.transaction.create({
                    data: {
                        walletId: (await tx.wallet.findUniqueOrThrow({ where: { userId: loan.userId } })).id,
                        type: 'DISBURSEMENT',
                        amount: netAmount,
                        status: 'COMPLETED',
                        description: `Loan Disbursement: ${loan.id} `
                    }
                });
            } else if (status === 'PAID') {
                await CreditScoreService.updateScore(loan.userId, CreditScoreRules.ON_TIME_REPAYMENT);
            } else if (status === 'DEFAULTED') {
                await CreditScoreService.updateScore(loan.userId, CreditScoreRules.DEFAULT);
            }
        });

        res.json({ message: `Loan ${status.toLowerCase()} ` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating loan' });
    }
};

// --- User Management ---

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                idNumber: true,
                phoneNumber: true,
                role: true,
                status: true,
                createdAt: true,
                emailVerified: true
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // VERIFIED, SUSPENDED, BLACKLISTED, ETC.

    try {
        const user = await prisma.user.update({
            where: { id },
            data: { status }
        });
        res.json({ message: 'User status updated', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user status' });
    }
};

export const getUserDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                idNumber: true,
                role: true,
                status: true,
                creditScore: true,
                createdAt: true,
                emailVerified: true,
                wallet: true,
                loans: { orderBy: { createdAt: 'desc' } },
                documents: { orderBy: { createdAt: 'desc' } }
            }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user details' });
    }
};

// --- System Settings ---

export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        // Convert array to object for easier frontend consumption
        const settingsMap = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    const settings = req.body; // Expects object { key: value }
    const adminId = (req.user as any).id;

    try {
        await prisma.$transaction(async (tx) => {
            await Promise.all(Object.keys(settings).map(key =>
                tx.systemSetting.upsert({
                    where: { key },
                    update: { value: String(settings[key]) },
                    create: { key, value: String(settings[key]) }
                })
            ));
        });

        // Audit Log
        await AuditService.log(adminId, 'UPDATE_SETTINGS', `Updated settings: ${Object.keys(settings).join(', ')} `, req.ip);

        res.json({ message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
};

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { actor: { select: { fullName: true, email: true } } }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching audit logs' });
    }
};

// Public Settings Access
export const getPublicSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['site_name', 'theme_color', 'logo_url', 'contact_email'] }
            }
        });

        // Convert array to object
        const settingsMap = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load settings' });
    }
};
