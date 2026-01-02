
import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { CreditScoreService, CreditScoreRules } from '../services/creditScore.service';

export const handleStkCallback = async (req: Request, res: Response) => {
    try {
        console.log("STK Callback Received:", JSON.stringify(req.body, null, 2));

        const callbackBody = req.body.Body.stkCallback;
        const resultCode = callbackBody.ResultCode; // 0 represents success

        if (resultCode !== 0) {
            console.log(`❌ STK Push Failed/Cancelled: ${callbackBody.ResultDesc}`);
            // Logic to mark transaction as FAILED could go here if we could identify it easily
            return res.json({ result: "acknowledged" });
        }

        const meta = callbackBody.CallbackMetadata.Item;
        const amount = Number(meta.find((m: any) => m.Name === 'Amount')?.Value);
        const mpesaReceipt = meta.find((m: any) => m.Name === 'MpesaReceiptNumber')?.Value;
        const phoneRaw = meta.find((m: any) => m.Name === 'PhoneNumber')?.Value?.toString();

        // Normalize phone to match our db format (e.g., 2547... -> 07... or keep as is?)
        // Our DB likely stores 07... or 254... Let's try to match loosely.

        console.log(`Processing Payment: ${mpesaReceipt} - KES ${amount} from ${phoneRaw}`);

        // 1. Find the Pending Transaction (Heuristic: Match PENDING, Amount, Type=REPAYMENT)
        // We assume the phone number matches the user's registered phone or we trust the flow.
        const transaction = await prisma.transaction.findFirst({
            where: {
                status: 'PENDING',
                type: 'REPAYMENT',
                amount: amount,
                createdAt: { gt: new Date(Date.now() - 1000 * 60 * 15) } // Created in last 15 mins
            },
            include: { wallet: true }
        });

        if (!transaction) {
            console.error("❌ Matching PENDING transaction not found for this repayment.");
            return res.json({ result: "acknowledged" });
        }

        // 2. Perform Updates
        await prisma.$transaction(async (tx) => {
            // A. Update Transaction
            await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'COMPLETED',
                    description: `${transaction.description} (Ref: ${mpesaReceipt})`
                }
            });

            // B. Find associated Loan
            // We parsed "Loan Repayment: {loanId}" in description?
            const description = transaction.description || '';
            const loanIdMatch = description.match(/Loan Repayment: ([a-zA-Z0-9-]+)/);
            if (loanIdMatch && loanIdMatch[1]) {
                const loanId = loanIdMatch[1];
                const loan = await tx.loan.findUnique({ where: { id: loanId } });

                if (loan) {
                    const newBalance = Math.max(0, Number(loan.balance) - amount);
                    const isFullyPaid = newBalance <= 0;

                    await tx.loan.update({
                        where: { id: loanId },
                        data: {
                            balance: newBalance,
                            status: isFullyPaid ? 'PAID' : loan.status
                        }
                    });

                    if (isFullyPaid && loan.status !== 'DEFAULTED') {
                        await CreditScoreService.updateScore(transaction.wallet.userId, CreditScoreRules.ON_TIME_REPAYMENT);
                    }
                }
            }
        });

        console.log(`✅ Payment Processed Successfully for Transaction ${transaction.id}`);
        res.json({ result: "success" });

    } catch (error) {
        console.error("Callback Error:", error);
        res.status(500).send("Error processing callback");
    }
};

export const handleB2cResult = async (req: Request, res: Response) => {
    try {
        console.log("B2C Result Received:", JSON.stringify(req.body, null, 2));

        const result = req.body.Result;
        const resultCode = result.ResultCode; // 0 success
        const transactionId = result.TransactionID;
        // B2C Callback usually includes "ConversationID" and "OriginatorConversationID" matched from request

        // For B2C, we can't easily match without storing ConversationID.
        // Heuristic: Find PENDING withdrawal of specific amount.
        const refItem = result.ResultParameters?.ResultParameter?.find((p: any) => p.Key === "TransactionAmount");
        const amount = refItem ? Number(refItem.Value) : 0;

        if (resultCode !== 0) {
            // FAILED
            console.log(`❌ B2C Failed: ${result.ResultDesc}`);
            // Refund the wallet!
            // Find matched pending withdrawal
            const transaction = await prisma.transaction.findFirst({
                where: {
                    status: 'PENDING',
                    type: 'WITHDRAWAL',
                    // amount: amount // If amount is available
                    createdAt: { gt: new Date(Date.now() - 1000 * 60 * 30) }
                },
                include: { wallet: true }
            });

            if (transaction) {
                await prisma.$transaction(async (tx) => {
                    // Refund
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: { balance: { increment: transaction.amount } }
                    });
                    // Mark Failed
                    await tx.transaction.update({
                        where: { id: transaction.id },
                        data: { status: 'FAILED', description: `${transaction.description} (Failed: ${result.ResultDesc})` }
                    });
                });
                console.log("Refunded failed withdrawal");
            }

        } else {
            // SUCCESS
            // Just mark transaction as COMPLETED
            const transaction = await prisma.transaction.findFirst({
                where: {
                    status: 'PENDING',
                    type: 'WITHDRAWAL',
                    // amount: amount,
                    createdAt: { gt: new Date(Date.now() - 1000 * 60 * 30) }
                }
            });

            if (transaction) {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'COMPLETED', description: `${transaction.description} (Ref: ${transactionId})` }
                });
                console.log("Confirmed withdrawal success");
            }
        }

        res.json({ result: "acknowledged" });
    } catch (error) {
        console.error("B2C Callback Error:", error);
        res.status(500).send("Error processing callback");
    }
};

export const handleB2cTimeout = async (req: Request, res: Response) => {
    console.log("B2C Timeout:", req.body);
    // Treat as failure check later or manual intervention
    res.json({ result: "acknowledged" });
};
