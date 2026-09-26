import { RequestHandler } from "express";
import { paypalCreateSchema, formatZodError } from "../../lib/validation";
import {
  assertQuoteAndAmount,
  recordPendingPayment,
  markPaymentCompleted,
  markPaymentFailed,
  PaymentValidationError,
} from "../../lib/paymentGuard";
import { getKesToUsdRate } from "../../lib/exchangeRate";
import { logger } from "../../lib/logger";

export interface PayPalPaymentRequest {
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

export interface PayPalConfig {
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

  // Verifies a webhook's authenticity via PayPal's own verification API,
  // instead of trusting whatever hits /paypal/webhook. Requires
  // PAYPAL_WEBHOOK_ID (from the webhook's config in the PayPal dashboard).
  async verifyWebhookSignature(headers: Record<string, any>, body: any): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.warn('PAYPAL_WEBHOOK_ID not set — cannot verify PayPal webhook signatures');
      return false;
    }
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: body,
        }),
      });
      const data = await response.json();
      return data.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('PayPal webhook verification error:', error);
      return false;
    }
  }
}

const paypalService = new PayPalService();

// Create PayPal payment
export const createPayPalPayment: RequestHandler = async (req, res) => {
  try {
    const parsed = paypalCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
    }
    const { amount: amountKes, quoteId } = parsed.data;
    const returnUrl = parsed.data.returnUrl || `${process.env.SITE_URL || ''}/quote?payment=paypal-success`;
    const cancelUrl = parsed.data.cancelUrl || `${process.env.SITE_URL || ''}/quote?payment=paypal-cancelled`;

    // Server-side authority check: quoteId must exist and the requested KES
    // amount must not exceed the real outstanding balance stored in the
    // database — the same guard every other payment method goes through.
    const quote = await assertQuoteAndAmount(quoteId, amountKes);

    // PayPal settles in USD, so convert using a live rate fetched
    // server-side. The client never supplies the USD figure — that was the
    // gap that let someone under-convert and pay less than the real total.
    const rate = await getKesToUsdRate();
    const usdAmount = Math.round(amountKes * rate * 100) / 100;
    if (usdAmount < 0.01) {
      return res.status(400).json({ success: false, message: "Amount too small to process via PayPal" });
    }

    logger.debug(`Creating PayPal payment: KES ${amountKes} (≈ USD ${usdAmount}) for quote ${quoteId}`);

    const result = await paypalService.createPayment({
      amount: usdAmount,
      currency: 'USD',
      quoteId,
      customerInfo: { name: quote.customerName, email: quote.customerEmail },
      returnUrl,
      cancelUrl,
    });

    await recordPendingPayment({
      quoteId: quote.id,
      method: 'paypal',
      amount: amountKes, // stored in KES, matching the quote's own currency
      currency: 'KES',
      providerRef: result.id,
    });

    // Extract approval URL
    const approvalUrl = result.links?.find((link: any) => link.rel === 'approve')?.href;

    res.json({
      success: true,
      message: 'PayPal payment created successfully',
      data: {
        orderId: result.id,
        approvalUrl,
        status: result.status,
        usdAmount,
        exchangeRate: rate,
      }
    });

  } catch (error) {
    if (error instanceof PaymentValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
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

    logger.debug(`Capturing PayPal payment for order: ${orderId}`);

    const result = await paypalService.capturePayment(orderId);

    // Check if capture was successful
    const captureStatus = result.purchase_units?.[0]?.payments?.captures?.[0]?.status;

    if (captureStatus === 'COMPLETED') {
      await markPaymentCompleted(orderId, result);
    } else if (captureStatus) {
      await markPaymentFailed(orderId, result);
    }

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
    const verified = await paypalService.verifyWebhookSignature(req.headers as any, req.body);
    if (!verified) {
      console.warn('PayPal webhook rejected: signature verification failed');
      return res.status(403).json({ success: false });
    }

    logger.debug('PayPal Webhook received:', JSON.stringify(req.body, null, 2));

    const eventType = req.body.event_type;
    const resource = req.body.resource;
    // orderId is what we stored as providerRef when the order was created;
    // capture events reference it via supplementary_data.related_ids.order_id
    const orderId = resource?.supplementary_data?.related_ids?.order_id || resource?.id;

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        logger.debug(`PayPal order approved: ${resource.id}`);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        logger.debug(`PayPal payment completed: ${resource.id}`);
        if (orderId) await markPaymentCompleted(orderId, req.body);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        logger.debug(`PayPal payment denied: ${resource.id}`);
        if (orderId) await markPaymentFailed(orderId, req.body);
        break;

      default:
        logger.debug(`Unhandled PayPal webhook event: ${eventType}`);
    }

    // Always respond with success to acknowledge receipt
    res.json({ success: true });

  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ success: false });
  }
};
