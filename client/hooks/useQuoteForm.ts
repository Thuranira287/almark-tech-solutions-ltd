import { useEffect, useState } from "react";
import { paymentService } from "@/lib/paymentService";
import { quoteServices } from "@/data/quoteServices";

export type PaymentMethodChoice = "mpesa" | "paypal" | "creditcard" | "";

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

export function useQuoteForm() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodChoice>("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any>(null);

  // Display-only total, computed from the local catalog for instant UI
  // feedback. The authoritative total is recomputed server-side in
  // paymentService.createQuote() before any payment is ever taken.
  useEffect(() => {
    const total = selectedServices.reduce((sum, serviceId) => {
      const service = quoteServices.find((s) => s.id === serviceId);
      return sum + (service?.basePrice || 0);
    }, 0);
    setTotalPrice(total);
  }, [selectedServices]);

  useEffect(() => {
    const calculatedBalance = totalPrice - paymentAmount;
    setBalance(calculatedBalance > 0 ? calculatedBalance : 0);
  }, [totalPrice, paymentAmount]);

  // Load available payment methods on mount
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const methodsResponse = await paymentService.getPaymentMethods();
        if (methodsResponse.success) {
          setPaymentMethods(methodsResponse.data);
        }
      } catch (error) {
        console.error("Failed to load payment data:", error);
      }
    };

    loadPaymentData();
  }, []);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitQuote = async () => {
    if (selectedServices.length === 0) {
      alert("Please select at least one service");
      return;
    }
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      alert("Please fill in all required fields");
      return;
    }
    if (!paymentMethod) {
      alert("Please select a payment method");
      return;
    }

    try {
      setIsProcessingPayment(true);
      // Create the quote server-side first. The server looks up current
      // prices from the database and returns the authoritative quoteId +
      // totalPrice — every payment call below is validated against this,
      // not against anything computed in the browser, so a tampered
      // request can no longer pay less than the real total.
      const quoteCreateResult = await paymentService.createQuote(selectedServices, customerInfo);
      if (!quoteCreateResult.success || !quoteCreateResult.data) {
        alert(`Could not create quote: ${quoteCreateResult.message || "Please try again."}`);
        setIsProcessingPayment(false);
        return;
      }
      const quoteId: string = quoteCreateResult.data.quoteId;

      // Send quote receipt email — the server rebuilds the receipt from the
      // quote record it just stored, not from this request body.
      const response = await fetch("/api/send-quote-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quoteId, paymentMethod, paymentAmount }),
      });

      const result = await response.json();

      if (result.success) {
        // Process payment if amount > 0
        let paymentResult = null;
        let paymentSuccessMessage = "";

        if (paymentAmount > 0) {
          try {
            if (paymentMethod === "mpesa") {
              const phoneNumber = customerInfo.phone || prompt("Please enter your M-Pesa phone number (e.g., 0712345678):");
              if (phoneNumber) {
                console.log('Initiating M-Pesa payment:', { phoneNumber, paymentAmount, quoteId });
                paymentResult = await paymentService.initiateMpesaPayment(
                  phoneNumber,
                  paymentAmount,
                  quoteId,
                  customerInfo
                );

                console.log('M-Pesa payment result:', paymentResult);

                if (paymentResult.success) {
                  if (paymentResult.data?.fallbackMode) {
                    paymentSuccessMessage = "\nPlease complete M-Pesa payment manually:\n" +
                      "1. Go to M-Pesa menu\n" +
                      "2. Select 'Send Money'\n" +
                      "3. Enter: 0716227616\n" +
                      `4. Amount: KES ${paymentAmount.toLocaleString()}\n` +
                      `5. Reference: ${quoteId}\n` +
                      "6. Send confirmation SMS to +254716227616";
                  } else {
                    paymentSuccessMessage = "\nM-Pesa payment initiated. Check your phone for the payment prompt.";
                  }
                } else {
                  paymentSuccessMessage = `\n M-Pesa payment failed: ${paymentResult.message}`;
                }
              } else {
                paymentSuccessMessage = "\n M-Pesa payment cancelled - phone number required.";
              }
            } else if (paymentMethod === "paypal") {
              console.log('Initiating PayPal payment:', { paymentAmount, quoteId });

              paymentResult = await paymentService.createPayPalPayment(
                paymentAmount,
                quoteId,
                customerInfo
              );

              console.log('PayPal payment result:', paymentResult);

              if (paymentResult.success && paymentResult.data?.approvalUrl) {
                paymentSuccessMessage = "\nRedirecting to PayPal for payment...";
                setTimeout(() => {
                  window.open(paymentResult.data.approvalUrl, '_blank');
                }, 2000);
              } else {
                paymentSuccessMessage = `\n PayPal payment failed: ${paymentResult.message}`;
              }
            } else if (paymentMethod === "creditcard") {
              console.log('Initiating card payment via Stripe Checkout:', { paymentAmount, quoteId });

              paymentResult = await paymentService.createCardCheckoutSession(
                paymentAmount,
                quoteId,
              );

              console.log('Card payment result:', paymentResult);

              if (paymentResult.success && paymentResult.data?.checkoutUrl) {
                paymentSuccessMessage = "\nRedirecting you to our secure card payment page...";
                setTimeout(() => {
                  window.location.href = paymentResult.data.checkoutUrl;
                }, 1500);
              } else {
                paymentSuccessMessage = `\n Card payment failed: ${paymentResult.message}`;
              }
            }
          } catch (error) {
            console.error('Payment processing error:', error);
            paymentSuccessMessage = "\n Payment processing encountered an issue. Please contact us for assistance.";
          }
        }

        // Show success message with WhatsApp option
        const paymentMessage =
          paymentAmount > 0
            ? `Amount to Pay: KES ${paymentAmount.toLocaleString()}\n` +
              `Balance Due: KES ${balance.toLocaleString()}\n`
            : "";

        const confirmed = confirm(
          `Quote submitted successfully!\n\n` +
            `Quote ID: ${quoteId}\n` +
            `Total: KES ${totalPrice.toLocaleString()}\n` +
            paymentMessage +
            paymentSuccessMessage +
            `\nReceipt sent to: ${customerInfo.email}\n\n` +
            `We'll contact you within 24 hours.\n\n` +
            `Would you like to continue the conversation on WhatsApp?`,
        );

        if (confirmed) {
          const whatsappPaymentText =
            paymentAmount > 0
              ? `Amount Paid: KES ${paymentAmount.toLocaleString()}\nBalance Due: KES ${balance.toLocaleString()}\n\n`
              : "";

          const whatsappMessage = encodeURIComponent(
            `Hello Almark Tech Solutions! I just submitted a quote request.\n\n` +
              `Quote ID: ${quoteId}\n` +
              `Total: KES ${totalPrice.toLocaleString()}\n` +
              whatsappPaymentText +
              `I'm interested in discussing the next steps.`,
          );
          window.open(
            `https://wa.me/254716227616?text=${whatsappMessage}`,
            "_blank",
          );
        }

        // Reset form
        setSelectedServices([]);
        setCustomerInfo({
          name: "",
          email: "",
          phone: "",
          company: "",
          message: "",
        });
        setPaymentMethod("");
        setPaymentAmount(0);
        setBalance(0);
      } else {
        alert(
          "Error submitting quote. Please try again or contact us directly.",
        );
      }
    } catch (error) {
      console.error("Error submitting quote:", error);
      alert("Error submitting quote. Please try again or contact us directly.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return {
    selectedServices,
    customerInfo,
    paymentMethod,
    setPaymentMethod,
    totalPrice,
    paymentAmount,
    setPaymentAmount,
    balance,
    isProcessingPayment,
    paymentMethods,
    handleServiceToggle,
    handleInputChange,
    handleSubmitQuote,
  };
}
