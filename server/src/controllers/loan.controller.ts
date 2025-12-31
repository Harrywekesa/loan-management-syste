import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { FormulaService } from '../services/formula.service';
import { z } from 'zod';

const applyLoanSchema = z.object({
    productId: z.string(),
    amount: z.number().positive(),
});

export const getLoanProducts = async (req: Request, res: Response) => {
    const products = await prisma.loanProduct.findMany({ where: { isActive: true } });
    res.json(products);
};

export const createLoanProduct = async (req: Request, res: Response) => {
    // Admin only logic to be added in routes
    try {
        const product = await prisma.loanProduct.create({ data: req.body });
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: 'Error creating product' });
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
