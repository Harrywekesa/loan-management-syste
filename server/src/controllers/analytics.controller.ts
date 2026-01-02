import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAdminSummary = async (req: Request, res: Response) => {
    try {
        const totalLoansIssued = await prisma.loan.count();
        const totalRepaidLoans = await prisma.loan.count({
            where: { status: 'PAID' }
        });
        const totalDefaultedLoans = await prisma.loan.count({
            where: { status: 'DEFAULTED' }
        });

        const totalPrincipalIssued = await prisma.loan.aggregate({
            _sum: {
                principal: true,
            },
        });

        const totalInterestEarned = await prisma.loan.aggregate({
            _sum: {
                interest: true,
            },
        });

        const totalPenaltiesCollected = await prisma.transaction.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                type: 'PENALTY'
            }
        });

        const totalWalletBalance = await prisma.wallet.aggregate({
            _sum: {
                balance: true,
            },
        });

        res.json({
            totalLoansIssued,
            totalRepaidLoans,
            totalDefaultedLoans,
            totalPrincipalIssued: totalPrincipalIssued._sum.principal || 0,
            totalInterestEarned: totalInterestEarned._sum.interest || 0,
            totalPenaltiesCollected: totalPenaltiesCollected._sum.amount || 0,
            totalWalletBalance: totalWalletBalance._sum.balance || 0,
        });
    } catch (error) {
        console.error('Error fetching admin summary:', error);
        res.status(500).json({ message: 'Error fetching admin summary' });
    }
};

export const getLoansReport = async (req: Request, res: Response) => {
    try {
        const loans = await prisma.loan.findMany({
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                    },
                },
                product: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(loans);
    } catch (error) {
        console.error('Error fetching loans report:', error);
        res.status(500).json({ message: 'Error fetching loans report' });
    }
};

export const getTransactionsReport = async (req: Request, res: Response) => {
    try {
        const transactions = await prisma.transaction.findMany({
            include: {
                wallet: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions report:', error);
        res.status(500).json({ message: 'Error fetching transactions report' });
    }
};