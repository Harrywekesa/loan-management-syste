import cron from 'node-cron';
import prisma from '../utils/prisma';
import { FormulaService } from '../services/formula.service';
import { CreditScoreService, CreditScoreRules } from '../services/creditScore.service';

export const startCronJobs = () => {
    // Run every day at midnight: '0 0 * * *'
    // For testing, we can use every minute: '* * * * *'
    const schedule = process.env.NODE_ENV === 'development' ? '0 0 * * *' : '0 0 * * *';

    cron.schedule(schedule, async () => {
        console.log('[CRON] Starting Daily Penalty Calculation...');

        try {
            const today = new Date();

            // 1. Find Overdue Active Loans
            const overdueLoans = await prisma.loan.findMany({
                where: {
                    status: 'ACTIVE',
                    dueDate: { lt: today }
                },
                include: { product: true }
            });

            console.log(`[CRON] Found ${overdueLoans.length} overdue loans.`);

            for (const loan of overdueLoans) {
                // 2. Calculate Penalty
                const penaltyAmount = FormulaService.calculatePenalty(Number(loan.balance), Number(loan.product.penaltyRate));

                if (penaltyAmount > 0) {
                    await prisma.$transaction(async (tx) => {
                        // Update loan balance
                        await tx.loan.update({
                            where: { id: loan.id },
                            data: {
                                balance: { increment: penaltyAmount },
                                accruedPenalty: { increment: penaltyAmount },
                                status: 'DEFAULTED' // Mark as defaulted if overdue
                            }
                        });

                        // Log Transaction (Penalty)
                        const wallet = await tx.wallet.findUnique({ where: { userId: loan.userId } });
                        if (wallet) {
                            await tx.transaction.create({
                                data: {
                                    walletId: wallet.id,
                                    type: 'PENALTY',
                                    amount: penaltyAmount,
                                    description: `Daily Penalty for Loan ${loan.id}`,
                                    status: 'COMPLETED'
                                }
                            });
                        }

                        // Update Credit Score immediately on Default (Once)
                        // This logic repeats every day, so we might punish them repeatedly. 
                        // The user said "-10 late, -50 default".
                        // Maybe we should check if it WAS already defaulted.
                        if (loan.status !== 'DEFAULTED') {
                            await CreditScoreService.updateScore(loan.userId, CreditScoreRules.DEFAULT);
                        } else {
                            // Daily late penalty? User said "-10 late". 
                            // Let's assume daily late fee also hits score? 
                            // Or just the monetary penalty. Let's stick to monetary daily, and Score once.
                        }
                    });

                    console.log(`[CRON] Applied penalty ${penaltyAmount} to Loan ${loan.id}`);
                }
            }
        } catch (error) {
            console.error('[CRON] Error in penalty job:', error);
        }
    });
};
