import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getWallet = async (req: any, res: Response) => {
    try {
        const wallet = await prisma.wallet.findUnique({
            where: { userId: req.user.id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        });
        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wallet' });
    }
};

export const withdraw = async (req: any, res: Response) => {
    // Logic for M-Pesa B2C to be integrated here
    // For now: Check balance -> Deduct -> Create Transaction
    const { amount } = req.body;
    const userId = req.user.id;
    const withdrawAmount = Number(amount);

    try {
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet || Number(wallet.balance) < withdrawAmount) {
            return res.status(400).json({ message: 'Insufficient funds' });
        }

        // Atomic transaction
        await prisma.$transaction(async (tx) => {
            // 1. Deduct Balance
            await tx.wallet.update({
                where: { userId },
                data: { balance: { decrement: withdrawAmount } }
            });

            // 2. Create Transaction Record
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'WITHDRAWAL',
                    amount: withdrawAmount,
                    status: 'PENDING', // Pending M-Pesa callback
                    description: 'Withdrawal to M-Pesa'
                }
            });
        });

        res.json({ message: 'Withdrawal initiated' });
    } catch (error) {
        res.status(500).json({ message: 'Withdrawal failed' });
    }
};
