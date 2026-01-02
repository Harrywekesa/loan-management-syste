export class FormulaService {
    private static toCents(amount: number): number {
        return Math.round(amount * 100);
    }

    private static fromCents(cents: number): number {
        return Number((cents / 100).toFixed(2));
    }

    /**
     * Calculates the interest amount based on Principal and Rate.
     * Currently implements Flat Rate method.
     */
    static calculateInterest(principal: number, rate: number): number {
        const principalCents = this.toCents(principal);
        const interestCents = Math.round(principalCents * (rate / 100));
        return this.fromCents(interestCents);
    }

    /**
     * Calculates the processing fee.
     * Can be a fixed amount or a percentage of the principal.
     */
    static calculateProcessingFee(principal: number, fee: number, isFixed: boolean): number {
        if (isFixed) {
            return Number(fee.toFixed(2));
        }
        const principalCents = this.toCents(principal);
        const feeCents = Math.round(principalCents * (fee / 100));
        return this.fromCents(feeCents);
    }

    /**
     * Calculates the total amount the user needs to repay.
     * Total = Principal + Interest
     */
    static calculateTotalRepayable(principal: number, interest: number): number {
        const principalCents = this.toCents(principal);
        const interestCents = this.toCents(interest);
        return this.fromCents(principalCents + interestCents);
    }

    /**
     * Calculates the actual amount disbursed to the user's wallet.
     * Credit = Principal - Processing Fee
     */
    static calculateWalletCredit(principal: number, fee: number): number {
        const principalCents = this.toCents(principal);
        const feeCents = this.toCents(fee);
        return this.fromCents(principalCents - feeCents);
    }

    /**
     * Calculates the daily penalty amount on the remaining balance.
     */
    static calculatePenalty(balance: number, penaltyRate: number): number {
        const balanceCents = this.toCents(balance);
        const penaltyCents = Math.round(balanceCents * (penaltyRate / 100));
        return this.fromCents(penaltyCents);
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
