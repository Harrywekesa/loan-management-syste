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

export const getAnalyticsTrends = async (req: Request, res: Response) => {
    try {
        // 1. Monthly Revenue (Interest + Fees)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Group Loans by month
        const loans = await prisma.loan.findMany({
            where: {
                createdAt: {
                    gte: sixMonthsAgo
                }
            },
            select: {
                createdAt: true,
                interest: true,
                processingFee: true,
                accruedPenalty: true,
                principal: true
            }
        });

        // Group Transactions by month
        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: {
                    gte: sixMonthsAgo
                }
            },
            select: {
                createdAt: true,
                type: true,
                amount: true
            }
        });

        // Initialize last 6 months buckets
        const trends = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

            // Filter for this month
            const monthlyLoans = loans.filter(l => l.createdAt >= monthStart && l.createdAt <= monthEnd);
            const monthlyTx = transactions.filter(t => t.createdAt >= monthStart && t.createdAt <= monthEnd);

            // Calculate Metrics
            const revenue = monthlyLoans.reduce((sum, l) => sum + Number(l.interest) + Number(l.processingFee) + Number(l.accruedPenalty), 0);
            const loansIssued = monthlyLoans.reduce((sum, l) => sum + Number(l.principal), 0);
            const repayment = monthlyTx.filter(t => t.type === 'REPAYMENT').reduce((sum, t) => sum + Number(t.amount), 0);

            trends.push({
                name: key,
                revenue,
                loansIssued,
                repayment
            });
        }

        res.json(trends);
    } catch (error) {
        console.error('Error fetching trends:', error);
        res.status(500).json({ message: 'Error fetching trends' });
    }
};