import axios from 'axios';
import { format } from 'date-fns';

export class MpesaService {
    private static get baseUrl() {
        return process.env.MPESA_ENV === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    private static async getAccessToken() {
        const consumerKey = process.env.MPESA_CONSUMER_KEY;
        const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

        if (!consumerKey || !consumerSecret) {
            throw new Error("M-ESA Consumer Key or Secret is missing in environment variables");
        }

        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        try {
            const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            });
            return response.data.access_token;
        } catch (error: any) {
            console.error("M-Pesa Token Error:", error?.response?.data || error.message);
            throw new Error("Failed to generate M-Pesa access token");
        }
    }

    /**
     * Initiates an STK Push (Lipa Na M-Pesa Online)
     */
    static async initiateSTKPush(phoneNumber: string, amount: number, reference: string) {
        try {
            const token = await this.getAccessToken();
            const timestamp = format(new Date(), "yyyyMMddHHmmss");
            const shortcode = process.env.MPESA_SHORTCODE;
            const passkey = process.env.MPESA_PASSKEY;
            const callbackUrl = process.env.MPESA_CALLBACK_URL;

            if (!shortcode || !passkey || !callbackUrl) {
                throw new Error("M-Pesa Shortcode, Passkey, or Callback URL is missing");
            }

            const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
            const formattedPhone = phoneNumber.startsWith('0') ? `254${phoneNumber.slice(1)}` : phoneNumber;

            const response = await axios.post(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: Math.floor(amount),
                PartyA: formattedPhone,
                PartyB: shortcode,
                PhoneNumber: formattedPhone,
                CallBackURL: `${callbackUrl}/stk`,
                AccountReference: reference,
                TransactionDesc: `Loan Payment: ${reference}`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data;
        } catch (error: any) {
            console.error("STK Push Error:", error?.response?.data || error.message);
            throw new Error("Failed to initiate STK Push");
        }
    }

    /**
     * Initiates a B2C (Business to Customer) transaction
     */
    static async initiateB2C(phoneNumber: string, amount: number, reference: string, commandId: string = "BusinessPayment") {
        try {
            const token = await this.getAccessToken();
            const shortcode = process.env.MPESA_B2C_SHORTCODE || process.env.MPESA_SHORTCODE;
            const initiator = process.env.MPESA_INITIATOR_NAME;
            const securityCredential = process.env.MPESA_SECURITY_CREDENTIAL;
            const callbackUrl = process.env.MPESA_CALLBACK_URL;

            if (!shortcode || !initiator || !securityCredential || !callbackUrl) {
                throw new Error("Missing M-Pesa B2C Configuration (Shortcode, Initiator, Credential, or Callback URL)");
            }

            const formattedPhone = phoneNumber.startsWith('0') ? `254${phoneNumber.slice(1)}` : phoneNumber;

            const response = await axios.post(`${this.baseUrl}/mpesa/b2c/v1/paymentrequest`, {
                InitiatorName: initiator,
                SecurityCredential: securityCredential,
                CommandID: commandId,
                Amount: Math.floor(amount),
                PartyA: shortcode,
                PartyB: formattedPhone,
                Remarks: reference,
                QueueTimeOutURL: `${callbackUrl}/b2c/timeout`,
                ResultURL: `${callbackUrl}/b2c/result`,
                Occasion: reference
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data;
        } catch (error: any) {
            console.error("B2C Error:", error?.response?.data || error.message);
            throw new Error("Failed to initiate B2C Transaction");
        }
    }
    /**
     * Check Account Balance (Async)
     */
    static async checkAccountBalance() {
        try {
            const token = await this.getAccessToken();
            const shortcode = process.env.MPESA_B2C_SHORTCODE || process.env.MPESA_SHORTCODE; // Use B2C shortcode (Paybill/Bureau)
            const initiator = process.env.MPESA_INITIATOR_NAME;
            const securityCredential = process.env.MPESA_SECURITY_CREDENTIAL;
            const callbackUrl = process.env.MPESA_CALLBACK_URL;

            if (!shortcode || !initiator || !securityCredential || !callbackUrl) {
                throw new Error("Missing M-Pesa Configuration for Balance Check");
            }

            const response = await axios.post(`${this.baseUrl}/mpesa/accountbalance/v1/query`, {
                Initiator: initiator,
                SecurityCredential: securityCredential,
                CommandID: "AccountBalance",
                PartyA: shortcode,
                IdentifierType: "4", // 4 = Shortcode/Organization
                Remarks: "Balance Check",
                QueueTimeOutURL: `${callbackUrl}/balance/timeout`,
                ResultURL: `${callbackUrl}/balance/result`,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data;
        } catch (error: any) {
            console.error("Balance Check Error:", error?.response?.data || error.message);
            throw new Error("Failed to initiate Balance Check");
        }
    }
}
