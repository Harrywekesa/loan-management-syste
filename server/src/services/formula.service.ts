export class FormulaService {
    /**
     * Calculates the interest amount based on Principal and Rate.
     * Currently implements Flat Rate method.
     */
    static calculateInterest(principal: number, rate: number): number {
        return Number((principal * (rate / 100)).toFixed(2));
    }

    /**
     * Calculates the processing fee.
     * Can be a fixed amount or a percentage of the principal.
     */
    static calculateProcessingFee(principal: number, fee: number, isFixed: boolean): number {
        if (isFixed) {
            return Number(fee.toFixed(2));
        }
        return Number((principal * (fee / 100)).toFixed(2));
    }

    /**
     * Calculates the total amount the user needs to repay.
     * Total = Principal + Interest
     */
    static calculateTotalRepayable(principal: number, interest: number): number {
        return Number((principal + interest).toFixed(2));
    }

    /**
     * Calculates the actual amount disbursed to the user's wallet.
     * Credit = Principal - Processing Fee
     */
    static calculateWalletCredit(principal: number, fee: number): number {
        return Number((principal - fee).toFixed(2));
    }

    /**
     * Calculates the daily penalty amount on the remaining balance.
     */
    static calculatePenalty(balance: number, penaltyRate: number): number {
        return Number((balance * (penaltyRate / 100)).toFixed(2));
    }

    /**
     * Calculates the due date based on the duration in days.
     */
    static calculateDueDate(durationDays: number): Date {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + durationDays);
        return dueDate;
    }
}
