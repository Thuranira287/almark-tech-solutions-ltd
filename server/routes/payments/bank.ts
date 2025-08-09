import { RequestHandler } from "express";

interface BankPaymentRequest {
  amount: number;
  currency: string;
  quoteId: string;
  customerInfo: {
    name: string;
    email: string;
  };
  bankCode: string;
  accountNumber?: string;
}

interface BankConfig {
  apiKey: string;
  apiSecret: string;
  merchantId: string;
  environment: 'sandbox' | 'production';
}

// Bank payment configuration - In production, use environment variables
const bankConfig: BankConfig = {
  apiKey: process.env.BANK_API_KEY || 'your_bank_api_key',
  apiSecret: process.env.BANK_API_SECRET || 'your_bank_api_secret',
  merchantId: process.env.BANK_MERCHANT_ID || 'your_merchant_id',
  environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production'
};

// Kenyan bank codes
const KENYAN_BANKS = {
  'KCB': { name: 'Kenya Commercial Bank', code: '01', paybill: '522522' },
  'EQUITY': { name: 'Equity Bank', code: '68', paybill: '247247' },
  'COOP': { name: 'Co-operative Bank', code: '11', paybill: '400200' },
  'ABSA': { name: 'Absa Bank Kenya', code: '03', paybill: '303030' },
  'STANDARD': { name: 'Standard Chartered', code: '02', paybill: '329329' },
  'DTB': { name: 'Diamond Trust Bank', code: '63', paybill: '525252' },
  'FAMILY': { name: 'Family Bank', code: '70', paybill: '222111' },
  'NCBA': { name: 'NCBA Bank', code: '07', paybill: '522522' },
  'STANBIC': { name: 'Stanbic Bank', code: '31', paybill: '100100' },
  'I&M': { name: 'I&M Bank', code: '57', paybill: '200200' }
};

class BankPaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = bankConfig.environment === 'production' 
      ? 'https://api.pesapal.com/api' 
      : 'https://cybqa.pesapal.com/pesapalv3/api';
  }

  // Get authentication token
  async getAccessToken(): Promise<string> {
    try {
      const payload = {
        consumer_key: bankConfig.apiKey,
        consumer_secret: bankConfig.apiSecret
      };

      const response = await fetch(`${this.baseUrl}/Auth/RequestToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get bank payment token: ${data.error_description || 'Unknown error'}`);
      }

      return data.token;
    } catch (error) {
      console.error('Bank Payment OAuth Error:', error);
      throw new Error('Failed to authenticate with bank payment API');
    }
  }

  // Register IPN (Instant Payment Notification) URL
  async registerIPN(token: string): Promise<string> {
    try {
      const payload = {
        url: process.env.BANK_IPN_URL || 'https://your-domain.com/api/bank/ipn',
        ipn_notification_type: 'GET'
      };

      const response = await fetch(`${this.baseUrl}/URLSetup/RegisterIPN`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to register IPN: ${data.error_description || 'Unknown error'}`);
      }

      return data.ipn_id;
    } catch (error) {
      console.error('Bank Payment IPN Registration Error:', error);
      throw error;
    }
  }

  // Submit order request
  async submitOrderRequest(request: BankPaymentRequest, token: string, ipnId: string): Promise<any> {
    try {
      const payload = {
        id: `ALM-${request.quoteId}-${Date.now()}`,
        currency: request.currency,
        amount: request.amount,
        description: `Payment for Quote ${request.quoteId} - Almark Tech Solutions`,
        callback_url: process.env.BANK_CALLBACK_URL || 'https://your-domain.com/payment-success',
        notification_id: ipnId,
        billing_address: {
          email_address: request.customerInfo.email,
          first_name: request.customerInfo.name.split(' ')[0],
          last_name: request.customerInfo.name.split(' ').slice(1).join(' ') || '',
          country_code: 'KE'
        }
      };

      const response = await fetch(`${this.baseUrl}/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to submit order request: ${data.error_description || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('Bank Payment Order Submission Error:', error);
      throw error;
    }
  }

  // Get transaction status
  async getTransactionStatus(orderTrackingId: string, token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get transaction status: ${data.error_description || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('Bank Payment Status Query Error:', error);
      throw error;
    }
  }

  // Generate bank transfer instructions
  generateBankTransferInstructions(bankCode: string, amount: number, quoteId: string): any {
    const bank = KENYAN_BANKS[bankCode as keyof typeof KENYAN_BANKS];
    
    if (!bank) {
      throw new Error('Unsupported bank code');
    }

    const reference = `ALM-${quoteId}`;
    
    return {
      bankName: bank.name,
      bankCode: bank.code,
      paybillNumber: bank.paybill,
      accountNumber: '0716227616', // Almark's account
      amount: amount,
      reference: reference,
      instructions: [
        `Go to your ${bank.name} mobile app or visit a branch`,
        `Select "Pay Bill" or "Send Money to Paybill"`,
        `Enter Paybill Number: ${bank.paybill}`,
        `Enter Account Number: 0716227616`,
        `Enter Amount: KES ${amount.toLocaleString()}`,
        `Enter Reference: ${reference}`,
        `Confirm and complete the transaction`,
        `Keep your transaction receipt for verification`
      ]
    };
  }
}

const bankPaymentService = new BankPaymentService();

// Create bank payment
export const createBankPayment: RequestHandler = async (req, res) => {
  try {
    const { amount, currency = 'KES', quoteId, customerInfo, bankCode } = req.body as BankPaymentRequest;

    // Validate required fields
    if (!amount || !quoteId || !customerInfo || !bankCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, quoteId, customerInfo, bankCode'
      });
    }

    // Validate amount
    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than KES 1'
      });
    }

    // Validate bank code
    if (!KENYAN_BANKS[bankCode as keyof typeof KENYAN_BANKS]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bank code'
      });
    }

    console.log(`Creating bank payment: ${currency} ${amount} via ${bankCode} for quote ${quoteId}`);

    // For direct bank transfer, generate instructions
    if (req.body.transferType === 'manual') {
      const instructions = bankPaymentService.generateBankTransferInstructions(bankCode, amount, quoteId);
      
      return res.json({
        success: true,
        message: 'Bank transfer instructions generated',
        paymentType: 'manual_transfer',
        data: instructions
      });
    }

    // For automated bank payment via PesaPal
    const token = await bankPaymentService.getAccessToken();
    const ipnId = await bankPaymentService.registerIPN(token);
    
    const result = await bankPaymentService.submitOrderRequest({
      amount,
      currency,
      quoteId,
      customerInfo,
      bankCode
    }, token, ipnId);

    res.json({
      success: true,
      message: 'Bank payment created successfully',
      paymentType: 'automated',
      data: {
        orderTrackingId: result.order_tracking_id,
        redirectUrl: result.redirect_url,
        merchantReference: result.merchant_reference
      }
    });

  } catch (error) {
    console.error('Bank payment creation error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create bank payment'
    });
  }
};

// Get bank payment status
export const getBankPaymentStatus: RequestHandler = async (req, res) => {
  try {
    const { orderTrackingId } = req.params;

    if (!orderTrackingId) {
      return res.status(400).json({
        success: false,
        message: 'Missing orderTrackingId parameter'
      });
    }

    const token = await bankPaymentService.getAccessToken();
    const result = await bankPaymentService.getTransactionStatus(orderTrackingId, token);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Bank payment status query error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get bank payment status'
    });
  }
};

// Get supported banks
export const getSupportedBanks: RequestHandler = async (req, res) => {
  try {
    const banks = Object.entries(KENYAN_BANKS).map(([code, details]) => ({
      code,
      name: details.name,
      paybill: details.paybill
    }));

    res.json({
      success: true,
      data: banks
    });

  } catch (error) {
    console.error('Get supported banks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supported banks'
    });
  }
};

// Bank payment IPN handler
export const handleBankPaymentIPN: RequestHandler = async (req, res) => {
  try {
    console.log('Bank Payment IPN received:', JSON.stringify(req.query, null, 2));

    const { OrderTrackingId, OrderMerchantReference, Status } = req.query;

    if (Status === 'COMPLETED') {
      console.log(`Bank payment completed for order: ${OrderTrackingId}`);
      
      // Here you would typically:
      // 1. Verify the transaction with the payment provider
      // 2. Update database with successful payment
      // 3. Send confirmation email to customer
      // 4. Update order status
      
    } else if (Status === 'FAILED') {
      console.log(`Bank payment failed for order: ${OrderTrackingId}`);
    }

    // Always respond with success to acknowledge receipt
    res.json({ success: true });

  } catch (error) {
    console.error('Bank payment IPN error:', error);
    res.status(500).json({ success: false });
  }
};
