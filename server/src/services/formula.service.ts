
/**
 * Financial Formulas Service
 * Implements strict calculation logic for loans.
 */

interface LoanInput {
    principal: number;
    interestRate: number; // Percentage
    processingFeeRate: number; // Percentage
    isFeeFixed: boolean;
    durationDays: number;
    penaltyRate: number; // Daily percentage
}

export class FormulaService {
    /**
     * Calculate Processing Fee
     * Formula: P * (F / 100) OR Fixed F
     */
    static calculateProcessingFee(principal: number, feeRate: number, isFixed: boolean): number {
        if (isFixed) return feeRate;
        return principal * (feeRate / 100);
    }

    /**
     * Calculate Interest (Flat Rate)
     * Formula: P * (R / 100)
     */
    static calculateInterest(principal: number, interestRate: number): number {
        return principal * (interestRate / 100);
    }

    /**
     * Calculate Total Repayable
     * Formula: P + Interest
     */
    static calculateTotalRepayable(principal: number, interest: number): number {
        return principal + interest;
    }

    /**
     * Calculate Due Date
     * Formula: Disbursal Date + T days
     */
    static calculateDueDate(disbursedAt: Date, durationDays: number): Date {
        const dueDate = new Date(disbursedAt);
        dueDate.setDate(dueDate.getDate() + durationDays);
        return dueDate;
    }

    /**
     * Calculate Daily Penalty
     * Formula: Outstanding Balance * (L / 100)
     */
    static calculateDailyPenalty(outstandingBalance: number, penaltyRate: number): number {
        return outstandingBalance * (penaltyRate / 100);
    }

    /**
     * Calculate Wallet Credit Amount
     * Formula: Principal - Processing Fee
     */
    static calculateWalletCredit(principal: number, processingFee: number): number {
        return principal - processingFee;
    }
}
