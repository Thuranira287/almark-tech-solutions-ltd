interface PaymentResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface PaymentRequest {
  paymentMethod: 'mpesa' | 'paypal' | 'bank';
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
    bankCode?: string;
    transferType?: 'manual' | 'automated';
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

  // Create payment for any method
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      // Read response body once as text
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
      }

      // Parse text as JSON
      const data = JSON.parse(responseText);
      return data;
    } catch (error) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create payment. Please try again.'
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

  // Capture payment (mainly for PayPal)
  async capturePayment(paymentMethod: string, paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${paymentMethod}/${paymentId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Read response body once as text
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
      }

      // Parse text as JSON
      const data = JSON.parse(responseText);
      return data;
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

  // PayPal specific methods
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
          currency: 'USD',
          quoteId,
          customerInfo,
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

  // Bank payment specific methods
  async createBankPayment(amount: number, quoteId: string, customerInfo: any, bankCode: string, transferType: 'manual' | 'automated' = 'manual'): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/bank/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'KES',
          quoteId,
          customerInfo,
          bankCode,
          transferType
        })
      });

      // Read response body once as text
      const responseText = await response.text();

      if (!response.ok) {
        console.error('Bank Payment API Error Response:', responseText);
        throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
      }

      // Parse text as JSON
      const data = JSON.parse(responseText);
      return data;
    } catch (error) {
      console.error('Bank payment error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create bank payment. Please try again.'
      };
    }
  }

  // Get supported banks
  async getSupportedBanks(): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/bank/banks`);

      if (!response.ok) {
        console.warn('Banks API not available, using fallback bank list');
        return this.getFallbackBanks();
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Banks API error, using fallback bank list:', error);
      return this.getFallbackBanks();
    }
  }

  // Fallback bank list when API is not available
  private getFallbackBanks(): PaymentResponse {
    return {
      success: true,
      message: 'Retrieved supported banks successfully',
      data: [
        { code: 'KCB', name: 'Kenya Commercial Bank', paybill: '522522' },
        { code: 'EQUITY', name: 'Equity Bank', paybill: '247247' },
        { code: 'COOP', name: 'Co-operative Bank', paybill: '400200' },
        { code: 'ABSA', name: 'Absa Bank Kenya', paybill: '303030' },
        { code: 'STANDARD', name: 'Standard Chartered', paybill: '329329' },
        { code: 'DTB', name: 'Diamond Trust Bank', paybill: '525252' },
        { code: 'FAMILY', name: 'Family Bank', paybill: '222111' },
        { code: 'NCBA', name: 'NCBA Bank', paybill: '522522' },
        { code: 'STANBIC', name: 'Stanbic Bank', paybill: '100100' },
        { code: 'I&M', name: 'I&M Bank', paybill: '200200' }
      ]
    };
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
    // Simple conversion rates - in production, use real-time rates
    const rates: { [key: string]: number } = {
      'KES_TO_USD': 0.0077, // 1 KES = 0.0077 USD (approximate)
      'USD_TO_KES': 130     // 1 USD = 130 KES (approximate)
    };

    const rateKey = `${from}_TO_${to}`;
    const rate = rates[rateKey];
    
    if (!rate) {
      return amount; // Return original amount if no conversion available
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
