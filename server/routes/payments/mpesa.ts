import { RequestHandler } from "express";
import crypto from "crypto";

interface MpesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  quoteId: string;
  customerInfo: {
    name: string;
    email: string;
  };
}

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  passkey: string;
  callbackUrl: string;
  environment: 'sandbox' | 'production';
}

// M-Pesa configuration - In production, use environment variables
const mpesaConfig: MpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || 'your_consumer_key',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'your_consumer_secret',
  businessShortCode: process.env.MPESA_SHORTCODE || '174379', // Safaricom test shortcode
  passkey: process.env.MPESA_PASSKEY || 'your_passkey',
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback',
  environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production'
};

class MpesaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = mpesaConfig.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
  }

  // Get OAuth token
  async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');
    
    try {
      const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get access token: ${data.error_description || 'Unknown error'}`);
      }

      return data.access_token;
    } catch (error) {
      console.error('M-Pesa OAuth Error:', error);
      throw new Error('Failed to authenticate with M-Pesa API');
    }
  }

  // Generate timestamp
  generateTimestamp(): string {
    const now = new Date();
    return now.getFullYear().toString() +
           ('0' + (now.getMonth() + 1)).slice(-2) +
           ('0' + now.getDate()).slice(-2) +
           ('0' + now.getHours()).slice(-2) +
           ('0' + now.getMinutes()).slice(-2) +
           ('0' + now.getSeconds()).slice(-2);
  }

  // Generate password
  generatePassword(timestamp: string): string {
    const data = mpesaConfig.businessShortCode + mpesaConfig.passkey + timestamp;
    return Buffer.from(data).toString('base64');
  }

  // Format phone number
  formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or other characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }

  // Initiate STK Push
  async initiateSTKPush(request: MpesaPaymentRequest): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);
      const formattedPhone = this.formatPhoneNumber(request.phoneNumber);

      const payload = {
        BusinessShortCode: mpesaConfig.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: request.amount,
        PartyA: formattedPhone,
        PartyB: mpesaConfig.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: mpesaConfig.callbackUrl,
        AccountReference: `ALM-${request.quoteId}`,
        TransactionDesc: `Payment for Quote ${request.quoteId} - Almark Tech Solutions`
      };

      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`M-Pesa STK Push failed: ${data.errorMessage || 'Unknown error'}`);
      }

      return {
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        responseCode: data.ResponseCode,
        responseDescription: data.ResponseDescription,
        customerMessage: data.CustomerMessage
      };
    } catch (error) {
      console.error('M-Pesa STK Push Error:', error);
      throw error;
    }
  }

  // Query STK Push status
  async querySTKPushStatus(checkoutRequestId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const payload = {
        BusinessShortCode: mpesaConfig.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`M-Pesa query failed: ${data.errorMessage || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('M-Pesa Query Error:', error);
      throw error;
    }
  }
}

const mpesaService = new MpesaService();

// Initiate M-Pesa payment
export const initiateMpesaPayment: RequestHandler = async (req, res) => {
  try {
    const { phoneNumber, amount, quoteId, customerInfo } = req.body as MpesaPaymentRequest;

    // Validate required fields
    if (!phoneNumber || !amount || !quoteId || !customerInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phoneNumber, amount, quoteId, customerInfo'
      });
    }

    // Validate amount
    if (amount < 1 || amount > 70000) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between KES 1 and KES 70,000'
      });
    }

    console.log(`Initiating M-Pesa payment: KES ${amount} from ${phoneNumber} for quote ${quoteId}`);

    const result = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount,
      quoteId,
      customerInfo
    });

    res.json({
      success: true,
      message: 'M-Pesa payment initiated successfully',
      data: result
    });

  } catch (error) {
    console.error('M-Pesa payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to initiate M-Pesa payment'
    });
  }
};

// Query M-Pesa payment status
export const queryMpesaPayment: RequestHandler = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: 'Missing checkoutRequestId parameter'
      });
    }

    const result = await mpesaService.querySTKPushStatus(checkoutRequestId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('M-Pesa query error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to query M-Pesa payment'
    });
  }
};

// M-Pesa callback handler
export const handleMpesaCallback: RequestHandler = async (req, res) => {
  try {
    console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    const callbackData = req.body;
    
    // Process the callback data
    // This is where you would update your database with payment status
    
    if (callbackData.Body?.stkCallback) {
      const callback = callbackData.Body.stkCallback;
      const resultCode = callback.ResultCode;
      const checkoutRequestId = callback.CheckoutRequestID;
      
      if (resultCode === 0) {
        // Payment successful
        console.log(`M-Pesa payment successful for CheckoutRequestID: ${checkoutRequestId}`);
        
        // Extract payment details
        const callbackMetadata = callback.CallbackMetadata?.Item || [];
        const paymentDetails = {
          amount: callbackMetadata.find((item: any) => item.Name === 'Amount')?.Value,
          mpesaReceiptNumber: callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value,
          transactionDate: callbackMetadata.find((item: any) => item.Name === 'TransactionDate')?.Value,
          phoneNumber: callbackMetadata.find((item: any) => item.Name === 'PhoneNumber')?.Value
        };
        
        // Here you would typically:
        // 1. Update database with successful payment
        // 2. Send confirmation email to customer
        // 3. Update order status
        
        console.log('Payment details:', paymentDetails);
      } else {
        // Payment failed
        console.log(`M-Pesa payment failed for CheckoutRequestID: ${checkoutRequestId}`, callback.ResultDesc);
      }
    }

    // Always respond with success to acknowledge receipt
    res.json({ success: true });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ success: false });
  }
};
