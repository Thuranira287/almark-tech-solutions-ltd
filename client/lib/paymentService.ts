interface PaymentResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface PaymentRequest {
  paymentMethod: 'mpesa' | 'paypal' | 'creditcard';
  amount: number;
  currency?: string;
  quoteId: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  paymentDetails?: {
    phoneNumber?: string;
    returnUrl?: string;
    cancelUrl?: string;
  };
}

class PaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/payments';
  }

  // Test if the payment API is available
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/ping');
      return response.ok;
    } catch (error) {
      console.error('Payment API connection test failed:', error);
      return false;
    }
  }

  // Create a quote server-side. The server looks up current prices from the
  // database and returns the authoritative quoteId + totalPrice — this is
  // what every payment call below is validated against, so a tampered
  // client-side total can no longer be sent to a payment provider.
  async createQuote(
    serviceIds: string[],
    customerInfo: { name: string; email: string; phone: string; company?: string; message?: string },
  ): Promise<PaymentResponse> {
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceIds, customerInfo }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
      }
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Quote creation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create quote. Please try again.',
      };
    }
  }

  // Get payment status
  async getPaymentStatus(paymentMethod: string, paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${paymentMethod}/${paymentId}/status`);

      // Read response body once as text
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
      }

      // Parse text as JSON
      const data = JSON.parse(responseText);
      return data;
    } catch (error) {
      console.error('Payment status error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get payment status. Please try again.'
      };
    }
  }

  // Capture a PayPal payment after the buyer approves it
  async capturePayPalOrder(orderId: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/paypal/${orderId}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
      }
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Payment capture error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to capture payment. Please try again.'
      };
    }
  }

  // Get available payment methods
  async getPaymentMethods(): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/methods`);

      // Read the response body once as text
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
      }

      // Parse the text as JSON
      try {
        const data = JSON.parse(responseText);
        return data;
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
    } catch (error) {
      console.error('Get payment methods error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get payment methods.'
      };
    }
  }

  // M-Pesa specific methods
  async initiateMpesaPayment(phoneNumber: string, amount: number, quoteId: string, customerInfo: any): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/mpesa/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          amount,
          quoteId,
          customerInfo
        })
      });

      // Read the response body once as text
      const responseText = await response.text();

      if (!response.ok) {
        console.error('M-Pesa API Error Response:', responseText);

        // If API is not available, provide manual instructions
        if (response.status === 404 || response.status === 500) {
          return {
            success: true,
            message: 'M-Pesa API temporarily unavailable. Please use manual payment.',
            data: {
              fallbackMode: true,
              instructions: [
                'Go to M-Pesa menu on your phone',
                'Select "Send Money"',
                'Enter: 0716227616',
                `Amount: KES ${amount.toLocaleString()}`,
                `Reference: ${quoteId}`,
                'Complete the payment',
                'Send the M-Pesa confirmation message to +254716227616'
              ]
            }
          };
        }

        throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
      }

      // Parse the text as JSON
      try {
        const data = JSON.parse(responseText);
        return data;
      } catch (parseError) {
        console.error('M-Pesa response parse error:', parseError, 'Response:', responseText);
        throw new Error(`Invalid JSON response from M-Pesa API: ${responseText}`);
      }
    } catch (error) {
      console.error('M-Pesa payment error:', error);

      // Provide fallback manual instructions for network errors
      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        return {
          success: true,
          message: 'Using manual M-Pesa payment method.',
          data: {
            fallbackMode: true,
            instructions: [
              'Go to M-Pesa menu on your phone',
              'Select "Send Money"',
              'Enter: 0716227616',
              `Amount: KES ${amount.toLocaleString()}`,
              `Reference: ${quoteId}`,
              'Complete the payment',
              'Send the M-Pesa confirmation message to +254716227616'
            ]
          }
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initiate M-Pesa payment. Please try again.'
      };
    }
  }

  // PayPal specific methods. `amount` is in KES — the server converts to
  // USD itself using a live exchange rate and validates it against the
  // real quote balance, so no currency math needs to happen (or be
  // trusted) on the client anymore.
  async createPayPalPayment(amount: number, quoteId: string, customerInfo: any): Promise<PaymentResponse> {
    try {
      const currentUrl = window.location.origin;
      const response = await fetch(`${this.baseUrl}/paypal/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          quoteId,
          returnUrl: `${currentUrl}/payment-success?method=paypal&quoteId=${quoteId}`,
          cancelUrl: `${currentUrl}/quote?cancelled=true`
        })
      });

      // Read response body once as text
      const responseText = await response.text();

      if (!response.ok) {
        console.error('PayPal API Error Response:', responseText);
        throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
      }

      // Parse text as JSON
      const data = JSON.parse(responseText);
      return data;
    } catch (error) {
      console.error('PayPal payment error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create PayPal payment. Please try again.'
      };
    }
  }

  // Card payment via Stripe Checkout — redirects the customer to a
  // Stripe-hosted page. No card data is ever collected on this site.
  async createCardCheckoutSession(amount: number, quoteId: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/card/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, quoteId }),
      });
      const responseText = await response.text();
      if (!response.ok) {
        console.error('Card Payment API Error Response:', responseText);
        throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
      }
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Card payment error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start card payment. Please try again.',
      };
    }
  }

  // Utility methods
  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }

  convertCurrency(amount: number, from: string, to: string): number {
    const rates: { [key: string]: number } = {
      'KES_TO_USD': 0.0077,
      'USD_TO_KES': 130
    };

    const rateKey = `${from}_TO_${to}`;
    const rate = rates[rateKey];
    
    if (!rate) {
      return amount;
    }
    
    return parseFloat((amount * rate).toFixed(2));
  }

  // Payment status polling (useful for M-Pesa and bank payments)
  async pollPaymentStatus(
    paymentMethod: string, 
    paymentId: string, 
    maxAttempts: number = 30, 
    interval: number = 2000
  ): Promise<PaymentResponse> {
    let attempts = 0;
    
    return new Promise((resolve) => {
      const poll = async () => {
        try {
          const status = await this.getPaymentStatus(paymentMethod, paymentId);

          if (status.success && status.data) {
            const paymentStatus = status.data.status || status.data.ResultCode;

            // Check if payment is completed
            if (paymentStatus === 'COMPLETED' || paymentStatus === 0 || paymentStatus === 'SUCCESS') {
              resolve(status);
              return;
            }

            // Check if payment failed
            if (paymentStatus === 'FAILED' || paymentStatus === 1 || paymentStatus === 'CANCELLED') {
              resolve(status);
              return;
            }
          }

          attempts++;

          if (attempts >= maxAttempts) {
            resolve({
              success: false,
              message: 'Payment status check timed out'
            });
            return;
          }

          setTimeout(poll, interval);
        } catch (error) {
          console.error(`Payment status polling error (attempt ${attempts + 1}):`, error);
          attempts++;
          if (attempts >= maxAttempts) {
            resolve({
              success: false,
              message: error instanceof Error ? error.message : 'Failed to check payment status'
            });
            return;
          }
          setTimeout(poll, interval);
        }
      };
      
      poll();
    });
  }
}

export const paymentService = new PaymentService();
export type { PaymentRequest, PaymentResponse };
