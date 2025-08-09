import { RequestHandler } from "express";

interface PayPalPaymentRequest {
  amount: number;
  currency: string;
  quoteId: string;
  customerInfo: {
    name: string;
    email: string;
  };
  returnUrl: string;
  cancelUrl: string;
}

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
}

// PayPal configuration - In production, use environment variables
const paypalConfig: PayPalConfig = {
  clientId: process.env.PAYPAL_CLIENT_ID || 'your_paypal_client_id',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'your_paypal_client_secret',
  environment: (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox') as 'sandbox' | 'live'
};

class PayPalService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = paypalConfig.environment === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
  }

  // Get OAuth token
  async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString('base64');
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to get PayPal access token: ${data.error_description || 'Unknown error'}`);
      }

      return data.access_token;
    } catch (error) {
      console.error('PayPal OAuth Error:', error);
      throw new Error('Failed to authenticate with PayPal API');
    }
  }

  // Create payment
  async createPayment(request: PayPalPaymentRequest): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const payload = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: request.quoteId,
          amount: {
            currency_code: request.currency,
            value: request.amount.toFixed(2)
          },
          description: `Payment for Quote ${request.quoteId} - Almark Tech Solutions`,
          custom_id: request.quoteId,
          invoice_id: `ALM-${request.quoteId}-${Date.now()}`
        }],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brand_name: 'Almark Tech Solutions',
              locale: 'en-US',
              landing_page: 'LOGIN',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW',
              return_url: request.returnUrl,
              cancel_url: request.cancelUrl
            }
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `ALM-${request.quoteId}-${Date.now()}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`PayPal payment creation failed: ${data.message || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('PayPal payment creation error:', error);
      throw error;
    }
  }

  // Capture payment
  async capturePayment(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`PayPal payment capture failed: ${data.message || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('PayPal payment capture error:', error);
      throw error;
    }
  }

  // Get payment details
  async getPaymentDetails(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`PayPal get payment failed: ${data.message || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('PayPal get payment error:', error);
      throw error;
    }
  }
}

const paypalService = new PayPalService();

// Create PayPal payment
export const createPayPalPayment: RequestHandler = async (req, res) => {
  try {
    const { amount, currency = 'USD', quoteId, customerInfo, returnUrl, cancelUrl } = req.body as PayPalPaymentRequest;

    // Validate required fields
    if (!amount || !quoteId || !customerInfo || !returnUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, quoteId, customerInfo, returnUrl, cancelUrl'
      });
    }

    // Validate amount
    if (amount < 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0.01'
      });
    }

    console.log(`Creating PayPal payment: ${currency} ${amount} for quote ${quoteId}`);

    const result = await paypalService.createPayment({
      amount,
      currency,
      quoteId,
      customerInfo,
      returnUrl,
      cancelUrl
    });

    // Extract approval URL
    const approvalUrl = result.links?.find((link: any) => link.rel === 'approve')?.href;

    res.json({
      success: true,
      message: 'PayPal payment created successfully',
      data: {
        orderId: result.id,
        approvalUrl,
        status: result.status
      }
    });

  } catch (error) {
    console.error('PayPal payment creation error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create PayPal payment'
    });
  }
};

// Capture PayPal payment
export const capturePayPalPayment: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing orderId parameter'
      });
    }

    console.log(`Capturing PayPal payment for order: ${orderId}`);

    const result = await paypalService.capturePayment(orderId);

    // Check if capture was successful
    const captureStatus = result.purchase_units?.[0]?.payments?.captures?.[0]?.status;

    res.json({
      success: true,
      message: 'PayPal payment captured successfully',
      data: {
        orderId: result.id,
        status: result.status,
        captureStatus,
        captureId: result.purchase_units?.[0]?.payments?.captures?.[0]?.id,
        amount: result.purchase_units?.[0]?.payments?.captures?.[0]?.amount
      }
    });

  } catch (error) {
    console.error('PayPal payment capture error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to capture PayPal payment'
    });
  }
};

// Get PayPal payment details
export const getPayPalPaymentDetails: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing orderId parameter'
      });
    }

    const result = await paypalService.getPaymentDetails(orderId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('PayPal get payment details error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get PayPal payment details'
    });
  }
};

// PayPal webhook handler
export const handlePayPalWebhook: RequestHandler = async (req, res) => {
  try {
    console.log('PayPal Webhook received:', JSON.stringify(req.body, null, 2));

    const eventType = req.body.event_type;
    const resource = req.body.resource;

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        console.log(`PayPal order approved: ${resource.id}`);
        // Handle order approval
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        console.log(`PayPal payment completed: ${resource.id}`);
        // Handle successful payment
        // Here you would typically:
        // 1. Update database with successful payment
        // 2. Send confirmation email to customer
        // 3. Update order status
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        console.log(`PayPal payment denied: ${resource.id}`);
        // Handle failed payment
        break;

      default:
        console.log(`Unhandled PayPal webhook event: ${eventType}`);
    }

    // Always respond with success to acknowledge receipt
    res.json({ success: true });

  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ success: false });
  }
};
