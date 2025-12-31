export class MpesaService {
    /**
     * Simulates an M-Pesa B2C (Business to Customer) payment.
     * In a real app, this would make an HTTP request to the Safaricom Daraja API.
     */
    static async initiateB2C(phoneNumber: string, amount: number, reference: string) {
        console.log(`[M-PESA MOCK] Initiating B2C Payment`);
        console.log(`To: ${phoneNumber}`);
        console.log(`Amount: ${amount}`);
        console.log(`Ref: ${reference}`);

        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate success
        return {
            ConversationID: `AG_${Math.random().toString(36).substring(7)}`,
            OriginatorConversationID: `OC_${Math.random().toString(36).substring(7)}`,
            ResponseCode: "0",
            ResponseDescription: "Accept the service request successfully."
        };
    }

    /**
     * Simulates an STK Push (Customer to Business).
     */
    static async initiateSTKPush(phoneNumber: string, amount: number, reference: string) {
        console.log(`[M-PESA MOCK] Initiating STK Push`);
        console.log(`To: ${phoneNumber}`);
        console.log(`Amount: ${amount}`);

        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
            MerchantRequestID: `MR_${Math.random().toString(36).substring(7)}`,
            CheckoutRequestID: `CR_${Math.random().toString(36).substring(7)}`,
            ResponseCode: "0",
            ResponseDescription: "Success. Request accepted for processing",
            CustomerMessage: "Success. Request accepted for processing"
        };
    }
}
