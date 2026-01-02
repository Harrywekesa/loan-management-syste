import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { MpesaService } from '../services/mpesa.service';

export const getWallet = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const wallet = await prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!wallet) {
            // Create wallet if not exists (Lazy creation)
            const newWallet = await prisma.wallet.create({
                data: { userId, balance: 0.0 }
            });
            return res.json(newWallet);
        }

        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wallet' });
    }
};

export const withdraw = async (req: any, res: Response) => {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    try {
        await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
            const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

            if (Number(wallet.balance) < Number(amount)) {
                throw new Error('Insufficient funds');
            }

            // 1. Deduct Balance IMMEDIATELY (To prevent double withdrawal)
            // If M-Pesa fails later (timeout/rejected), we refund via Callback logic.
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: Number(amount) } }
            });

            // 2. Record Transaction (PENDING)
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'WITHDRAWAL',
                    amount: Number(amount),
                    status: 'PENDING',
                    description: 'Withdrawal to M-Pesa'
                }
            });

            // 3. Initiate M-Pesa B2C
            // Use transaction ID as reference for matching in callback
            await MpesaService.initiateB2C(user.phoneNumber || '254700000000', amount, `W-${transaction.id}`);

            // Leave status as PENDING.
        });

        res.json({ message: 'Withdrawal request processed. Please wait for M-Pesa confirmation.' });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Withdrawal failed' });
    }
};
