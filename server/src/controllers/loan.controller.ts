import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { FormulaService } from '../services/formula.service';
import { CreditScoreService, CreditScoreRules } from '../services/creditScore.service';
import { MpesaService } from '../services/mpesa.service';
import { z } from 'zod';

const repayLoanSchema = z.object({
    amount: z.number().positive(),
    phoneNumber: z.string().optional() // Make optional, fallback to user phone
});

export const repayLoan = async (req: any, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const { amount, phoneNumber } = repayLoanSchema.parse(req.body);

        await prisma.$transaction(async (tx) => {
            const loan = await tx.loan.findUniqueOrThrow({ where: { id } });

            if (loan.status === 'PAID') throw new Error('Loan is already paid');
            if (loan.status === 'PENDING' || loan.status === 'REJECTED') throw new Error('Loan is not active');

            const currentBalance = Number(loan.balance);
            if (amount > currentBalance) {
                throw new Error(`Amount exceeds balance. Outstanding: ${currentBalance}`);
            }

            const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
            const finalPhone = phoneNumber || user.phoneNumber || '254700000000';

            // 1. Simulate M-Pesa 
            const mpesaRes = await MpesaService.initiateSTKPush(finalPhone, amount, `REPAY-${loan.id}`);
            if (mpesaRes.ResponseCode !== '0') throw new Error('M-Pesa payment failed');

            // 2. Update Loan Balance
            const newBalance = Number((currentBalance - amount).toFixed(2));
            const isFullyPaid = newBalance <= 0;

            await tx.loan.update({
                where: { id },
                data: {
                    balance: newBalance,
                    status: isFullyPaid ? 'PAID' : loan.status // Keep ACTIVE or DEFAULTED if not fully paid
                }
            });

            // 3. Log Transaction
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (wallet) {
                await tx.transaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'REPAYMENT',
                        amount: amount,
                        description: `Loan Repayment: ${loan.id}`,
                        status: 'COMPLETED'
                    }
                });
            }

            // 4. Handle Full Repayment Events
            if (isFullyPaid) {
                // Update Credit Score
                await CreditScoreService.updateScore(userId, CreditScoreRules.ON_TIME_REPAYMENT);
            }
        });

        res.json({ message: 'Repayment processed successfully', amount });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Repayment failed' });
    }
};

const applyLoanSchema = z.object({
    productId: z.string(),
    amount: z.number().positive(),
});

export const getLoanProducts = async (req: Request, res: Response) => {
    try {
        // Admin gets all, Borrower gets only active
        const isAdmin = (req.user as any)?.role === 'ADMIN' || (req.user as any)?.role === 'SUPER_ADMIN';
        const where = isAdmin ? {} : { isActive: true };

        const products = await prisma.loanProduct.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
};

export const createLoanProduct = async (req: Request, res: Response) => {
    try {
        const product = await prisma.loanProduct.create({
            data: {
                ...req.body,
                minAmount: Number(req.body.minAmount),
                maxAmount: Number(req.body.maxAmount),
                interestRate: Number(req.body.interestRate),
                processingFee: Number(req.body.processingFee),
                penaltyRate: Number(req.body.penaltyRate),
                minCreditScore: Number(req.body.minCreditScore || 0),
                durationDays: Number(req.body.durationDays)
            }
        });
        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating product' });
    }
};

export const updateLoanProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const product = await prisma.loanProduct.update({
            where: { id },
            data: {
                ...req.body,
                minAmount: req.body.minAmount ? Number(req.body.minAmount) : undefined,
                maxAmount: req.body.maxAmount ? Number(req.body.maxAmount) : undefined,
                interestRate: req.body.interestRate ? Number(req.body.interestRate) : undefined,
                processingFee: req.body.processingFee ? Number(req.body.processingFee) : undefined,
                penaltyRate: req.body.penaltyRate ? Number(req.body.penaltyRate) : undefined,
                minCreditScore: req.body.minCreditScore !== undefined ? Number(req.body.minCreditScore) : undefined,
                durationDays: req.body.durationDays ? Number(req.body.durationDays) : undefined
            }
        });
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: 'Error updating product' });
    }
};

export const calculateLoan = async (req: Request, res: Response) => {
    const { productId, amount } = req.body;

    const product = await prisma.loanProduct.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const principal = Number(amount);
    const fee = FormulaService.calculateProcessingFee(principal, Number(product.processingFee), product.isFeeFixed);
    const interest = FormulaService.calculateInterest(principal, Number(product.interestRate));
    const total = FormulaService.calculateTotalRepayable(principal, interest);
    const credit = FormulaService.calculateWalletCredit(principal, fee);

    res.json({
        principal,
        processingFee: fee,
        interest,
        totalRepayable: total,
        walletCredit: credit,
        durationDays: product.durationDays
    });
};

export const applyLoan = async (req: any, res: Response) => {
    try {
        const { productId, amount } = applyLoanSchema.parse(req.body);
        const userId = req.user.id;

        // 1. Check if user is verified
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.status !== 'VERIFIED') return res.status(400).json({ message: 'User not verified' });

        // 2. Get Product
        const product = await prisma.loanProduct.findUnique({ where: { id: productId } });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // NEW: Check for Existing Active Loans
        const activeLoan = await prisma.loan.findFirst({
            where: {
                userId,
                status: { in: ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE', 'DEFAULTED'] },
                balance: { gt: 0 }
            }
        });

        if (activeLoan) {
            return res.status(400).json({
                message: 'You already have an active or pending loan. Please repay it first.'
            });
        }

        // NEW: Check Credit Score Eligibility
        if (user.creditScore < product.minCreditScore) {
            return res.status(400).json({
                message: `Insufficient Credit Score. Required: ${product.minCreditScore}, Yours: ${user.creditScore}`
            });
        }

        // 3. Calculate
        const principal = Number(amount);
        const fee = FormulaService.calculateProcessingFee(principal, Number(product.processingFee), product.isFeeFixed);
        const interest = FormulaService.calculateInterest(principal, Number(product.interestRate));
        const total = FormulaService.calculateTotalRepayable(principal, interest);

        // 4. Create Loan (Pending)
        const loan = await prisma.loan.create({
            data: {
                userId,
                productId,
                principal,
                interest,
                processingFee: fee,
                totalPayable: total,
                balance: total, // Initial balance is total repayable
                status: 'PENDING'
            }
        });

        res.status(201).json(loan);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Application failed' });
    }
};

export const getMyLoans = async (req: any, res: Response) => {
    try {
        const loans = await prisma.loan.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: { product: true }
        });
        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching loans' });
    }
};
