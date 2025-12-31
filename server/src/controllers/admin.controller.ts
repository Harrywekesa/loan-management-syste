import { Request, Response } from 'express';
import prisma from '../utils/prisma';

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
    const { status } = req.body; // APPROVED, REJECTED

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
                    disbursedAt: status === 'APPROVED' ? new Date() : null,
                    dueDate: status === 'APPROVED' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null // Simplistic due date
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
                        description: `Loan Disbursement: ${loan.id}`
                    }
                });
            }
        });

        res.json({ message: `Loan ${status.toLowerCase()}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating loan' });
    }
};
