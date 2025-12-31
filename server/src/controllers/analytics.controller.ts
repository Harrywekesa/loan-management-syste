import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getSummaryReport = async (req: Request, res: Response) => {
    try {
        const totalLoans = await prisma.loan.count();
        const activeLoans = await prisma.loan.count({ where: { status: { in: ['ACTIVE', 'APPROVED', 'DISBURSED'] } } });
        const defaultedLoans = await prisma.loan.count({ where: { status: 'DEFAULTED' } });

        // Financials
        const totalDisbursed = await prisma.loan.aggregate({
            where: { status: { not: 'REJECTED' } },
            _sum: { principal: true }
        });

        const totalInterest = await prisma.loan.aggregate({
            where: { status: { in: ['PAID', 'ACTIVE', 'DEFAULTED'] } },
            _sum: { interest: true }
        });

        const totalPenalties = await prisma.loan.aggregate({
            _sum: { accruedPenalty: true }
        });

        const wallet = await prisma.wallet.aggregate({ _sum: { balance: true } });

        res.json({
            counts: {
                total: totalLoans,
                active: activeLoans,
                defaulted: defaultedLoans,
                completed: await prisma.loan.count({ where: { status: 'PAID' } })
            },
            financials: {
                disbursed: totalDisbursed._sum.principal || 0,
                interestEarned: totalInterest._sum.interest || 0,
                penaltiesAccrued: totalPenalties._sum.accruedPenalty || 0,
                systemWallet: 1000000 // Mock system balance or derive from transactions
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching report' });
    }
};

export const getTrends = async (req: Request, res: Response) => {
    try {
        // Group loans by date (Simplistic approach: Last 7 days)
        const today = new Date();
        const last7Days = new Array(7).fill(0).map((_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const data = [];

        for (const date of last7Days) {
            const count = await prisma.loan.count({
                where: {
                    createdAt: {
                        gte: new Date(`${date}T00:00:00.000Z`),
                        lt: new Date(`${date}T23:59:59.999Z`)
                    }
                }
            });
            data.push({ date, count });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trends' });
    }
};
