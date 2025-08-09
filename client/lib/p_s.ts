// paymentService.ts
export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface PaymentRequest {
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
  private readonly baseUrl = '/api/payments';

  /** Generic fetch wrapper */
  private async request<T = PaymentResponse>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
        ...options
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText || 'Request failed'}`);
      }

      try {
        return JSON.parse(responseText) as T;
      } catch {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
    } catch (error) {
      console.error(`Request to ${endpoint} failed:`, error);
      throw error;
    }
  }

  /** Core API */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/ping');
      return response.ok;
    } catch (err) {
      console.error('Payment API connection test failed:', err);
      return false;
    }
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      return await this.request(`${this.baseUrl}/create`, {
        method: 'POST',
        body: JSON.stringify(request)
      });
    } catch (error) {
      return this.errorResponse(error, 'Failed to create payment. Please try again.');
    }
  }

  async getPaymentStatus(paymentMethod: string, paymentId: string): Promise<PaymentResponse> {
    try {
      return await this.request(`${this.baseUrl}/${paymentMethod}/${paymentId}/status`);
    } catch (error) {
      return this.errorResponse(error, 'Failed to get payment status. Please try again.');
    }
  }

  async capturePayment(paymentMethod: string, paymentId: string): Promise<PaymentResponse> {
    try {
      return await this.request(`${this.baseUrl}/${paymentMethod}/${paymentId}/capture`, {
        method: 'POST'
      });
    } catch (error) {
      return this.errorResponse(error, 'Failed to capture payment. Please try again.');
    }
  }

  async getPaymentMethods(): Promise<PaymentResponse> {
    try {
      return await this.request(`${this.baseUrl}/methods`);
    } catch (error) {
      return this.errorResponse(error, 'Failed to get payment methods.');
    }
  }

  /** M-Pesa */
  async initiateMpesaPayment(
    phoneNumber: string,
    amount: number,
    quoteId: string,
    customerInfo: Record<string, any>
  ): Promise<PaymentResponse> {
    try {
      return await this.request(`${this.baseUrl}/mpesa/initiate`, {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, amount, quoteId, customerInfo })
      });
    } catch (error) {
      return this.mpesaFallback(error, amount, quoteId);
    }
  }

  /** PayPal */
  async createPayPalPayment(
    amount: number,
    quoteId: string,
    customerInfo: Record<string, any>
  ): Promise<PaymentResponse> {
    try {
      const currentUrl = window.location.origin;
      return await this.request(`${this.baseUrl}/paypal/create`, {
        method: 'POST',
        body: JSON.stringify({
          amount,
          currency: 'USD',
          quoteId,
          customerInfo,
          returnUrl: `${currentUrl}/payment-success?method=paypal&quoteId=${quoteId}`,
          cancelUrl: `${currentUrl}/quote?cancelled=true`
        })
      });
    } catch (error) {
      return this.errorResponse(error, 'Failed to create PayPal payment. Please try again.');
    }
  }

  /** Bank */
  async createBankPayment(
    amount: number,
    quoteId: string,
    customerInfo: Record<string, any>,
    bankCode: string,
    transferType: 'manual' | 'automated' = 'manual'
  ): Promise<PaymentResponse> {
    try {
      return await this.request(`${this.baseUrl}/bank/create`, {
        method: 'POST',
        body: JSON.stringify({ amount, currency: 'KES', quoteId, customerInfo, bankCode, transferType })
      });
    } catch (error) {
      return this.errorResponse(error, 'Failed to create bank payment. Please try again.');
    }
  }

  async getSupportedBanks(): Promise<PaymentResponse> {
    try {
      return await this.request(`${this.baseUrl}/bank/banks`);
    } catch (error) {
      console.warn('Banks API unavailable, using fallback list:', error);
      return this.getFallbackBanks();
    }
  }

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

  /** Utilities */
  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '254' + cleaned.slice(1);
    else if (['7', '1'].includes(cleaned[0])) cleaned = '254' + cleaned;
    else if (!cleaned.startsWith('254')) cleaned = '254' + cleaned;
    return cleaned;
  }

  convertCurrency(amount: number, from: string, to: string): number {
    const rates: Record<string, number> = {
      'KES_TO_USD': 0.0077,
      'USD_TO_KES': 130
    };
    const rate = rates[`${from}_TO_${to}`];
    return rate ? parseFloat((amount * rate).toFixed(2)) : amount;
  }

  /** Polling */
  async pollPaymentStatus(
    paymentMethod: string,
    paymentId: string,
    maxAttempts = 30,
    interval = 2000
  ): Promise<PaymentResponse> {
    let attempts = 0;
    return new Promise((resolve) => {
      const poll = async () => {
        try {
          const status = await this.getPaymentStatus(paymentMethod, paymentId);
          const paymentStatus = status?.data?.status ?? status?.data?.ResultCode;

          if (['COMPLETED', 'SUCCESS'].includes(paymentStatus) || paymentStatus === 0) return resolve(status);
          if (['FAILED', 'CANCELLED'].includes(paymentStatus) || paymentStatus === 1) return resolve(status);

          if (++attempts >= maxAttempts) return resolve({ success: false, message: 'Payment status check timed out' });
          setTimeout(poll, interval);
        } catch (error) {
          console.error(`Polling error (attempt ${attempts + 1}):`, error);
          if (++attempts >= maxAttempts) return resolve(this.errorResponse(error, 'Failed to check payment status'));
          setTimeout(poll, interval);
        }
      };
      poll();
    });
  }

  /** Private helpers */
  private errorResponse(error: unknown, fallback: string): PaymentResponse {
    return {
      success: false,
      message: error instanceof Error ? error.message : fallback
    };
  }

  private mpesaFallback(error: unknown, amount: number, quoteId: string): PaymentResponse {
    console.error('M-Pesa payment error:', error);
    const manualInstructions = [
      'Go to M-Pesa menu on your phone',
      'Select "Send Money"',
      'Enter: 0716227616',
      `Amount: KES ${amount.toLocaleString()}`,
      `Reference: ${quoteId}`,
      'Complete the payment',
      'Send the M-Pesa confirmation message to +254716227616'
    ];

    if (error instanceof TypeError || (error as any)?.status === 404 || (error as any)?.status === 500) {
      return { success: true, message: 'M-Pesa API unavailable. Please use manual payment.', data: { fallbackMode: true, instructions: manualInstructions } };
    }

    return this.errorResponse(error, 'Failed to initiate M-Pesa payment. Please try again.');
  }
}

export const paymentService = new PaymentService();
