import prisma from '../utils/prisma';

export const CreditScoreRules = {
    ON_TIME_REPAYMENT: 10,
    PARTIAL_REPAYMENT: 5,
    LATE_REPAYMENT: -10,
    DEFAULT: -50,
    MAX_SCORE: 100,
    MIN_SCORE: 0
};

export class CreditScoreService {
    /**
     * Updates the user's credit score based on the action.
     */
    static async updateScore(userId: string, change: number) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return;

        let newScore = (user.creditScore || 50) + change;

        // Clamp score between MIN and MAX
        if (newScore > CreditScoreRules.MAX_SCORE) newScore = CreditScoreRules.MAX_SCORE;
        if (newScore < CreditScoreRules.MIN_SCORE) newScore = CreditScoreRules.MIN_SCORE;

        await prisma.user.update({
            where: { id: userId },
            data: { creditScore: newScore }
        });

        console.log(`[CREDIT SCORE] User ${userId} score updated: ${user.creditScore} -> ${newScore} (${change > 0 ? '+' : ''}${change})`);
    }

    /**
     * Checks if a user is eligible for a product based on credit score.
     */
    static async checkEligibility(userId: string, minScore: number): Promise<boolean> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return false;
        return (user.creditScore || 50) >= minScore;
    }
}
