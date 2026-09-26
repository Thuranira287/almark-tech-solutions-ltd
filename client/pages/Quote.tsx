import { ArrowLeft, Loader2, Phone, MessageCircle, ShieldCheck, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuoteForm } from "@/hooks/useQuoteForm";
import ServiceSelection from "@/components/quote/ServiceSelection";
import QuoteSummary from "@/components/quote/QuoteSummary";
import CustomerInfoCard from "@/components/quote/CustomerInfoCard";
import PaymentMethodCard from "@/components/quote/PaymentMethodCard";
import PageHead from "@/components/PageHead";

export default function Quote() {
  const {
    selectedServices,
    customerInfo,
    paymentMethod,
    setPaymentMethod,
    totalPrice,
    paymentAmount,
    setPaymentAmount,
    balance,
    isProcessingPayment,
    handleServiceToggle,
    handleInputChange,
    handleSubmitQuote,
  } = useQuoteForm();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <PageHead path="/quote" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-brand-gold hover:text-brand-gold-dark mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-2">
            Get Your Quote
          </h1>
          <p className="text-lg text-gray-600">
            Select the services you need and get an instant quote
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ServiceSelection
            selectedServices={selectedServices}
            onToggle={handleServiceToggle}
          />

            <div className="space-y-6">
            <QuoteSummary
              selectedServices={selectedServices}
              totalPrice={totalPrice}
              paymentMethod={paymentMethod}
              paymentAmount={paymentAmount}
              balance={balance}
            />

            <CustomerInfoCard customerInfo={customerInfo} onChange={handleInputChange} />

            <PaymentMethodCard
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
              totalPrice={totalPrice}
              balance={balance}
            />

                <Button
              onClick={handleSubmitQuote}
              disabled={isProcessingPayment}
              className="w-full bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold py-3"
              size="lg"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Quote Request"
              )}
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                Encrypted & secure
              </span>
              <span className="flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-green-600" />
                Card details never stored on our servers
              </span>
            </div>

                <Card className="bg-brand-dark text-white">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3 text-brand-gold">
                  Need Help?
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>+254716227616</span>
                  </div>
                  <a
                    href="https://wa.me/254716227616?text=Hello%20Almark%20Tech%20Solutions,%20I%20need%20help%20with%20my%20quote"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Quick WhatsApp Support</span>
                  </a>
                  <p>Get instant help with your quote</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
