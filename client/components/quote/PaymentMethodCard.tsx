import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, CreditCard, ShieldCheck } from "lucide-react";
import { PaymentMethodChoice } from "@/hooks/useQuoteForm";

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethodChoice;
  setPaymentMethod: (method: PaymentMethodChoice) => void;
  paymentAmount: number;
  setPaymentAmount: (amount: number) => void;
  totalPrice: number;
  balance: number;
}

export default function PaymentMethodCard({
  paymentMethod,
  setPaymentMethod,
  paymentAmount,
  setPaymentAmount,
  totalPrice,
  balance,
}: PaymentMethodCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-dark">Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="mpesa"
            checked={paymentMethod === "mpesa"}
            onCheckedChange={() => setPaymentMethod(paymentMethod === "mpesa" ? "" : "mpesa")}
          />
          <Label htmlFor="mpesa" className="flex items-center space-x-2 cursor-pointer">
            <Phone className="h-4 w-4 text-green-600" />
            <span>M-Pesa</span>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="paypal"
            checked={paymentMethod === "paypal"}
            onCheckedChange={() => setPaymentMethod(paymentMethod === "paypal" ? "" : "paypal")}
          />
          <Label htmlFor="paypal" className="flex items-center space-x-2 cursor-pointer">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span>PayPal</span>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="creditcard"
            checked={paymentMethod === "creditcard"}
            onCheckedChange={() => setPaymentMethod(paymentMethod === "creditcard" ? "" : "creditcard")}
          />
          <Label htmlFor="creditcard" className="flex items-center space-x-2 cursor-pointer">
            <CreditCard className="h-4 w-4 text-purple-600" />
            <span>Credit/Debit Card</span>
          </Label>
        </div>

        {paymentMethod && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <Label htmlFor="paymentAmount" className="text-sm font-semibold text-brand-dark">
              Amount to Pay (KES)
            </Label>
            <Input
              id="paymentAmount"
              type="number"
              value={paymentAmount || ""}
              onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
              placeholder="Enter amount to pay"
              min="0"
              max={totalPrice}
              className="mt-2"
            />

            {paymentAmount > 0 && (
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Quote:</span>
                  <span className="font-semibold">KES {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paying:</span>
                  <span className="font-semibold text-green-600">
                    KES {paymentAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance:</span>
                  <span className="font-semibold text-orange-600">
                    KES {balance.toLocaleString()}
                  </span>
                </div>

                {paymentMethod === "mpesa" && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                    <p className="text-green-700 font-semibold">M-Pesa Payment Instructions:</p>
                    <p className="text-green-600">
                      1. Go to M-Pesa menu
                      <br />
                      2. Select "Send Money"
                      <br />
                      3. Enter: <strong>0716227616</strong> (Almark Tech Solutions)
                      <br />
                      4. Amount: <strong>KES {paymentAmount.toLocaleString()}</strong>
                      <br />
                      5. Complete payment
                      <br />
                      6. <em>Save M-Pesa confirmation message for your records</em>
                    </p>
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-700 text-xs">
                        <strong>Note:</strong> Payment will reflect in Almark's account
                        (0716227616) immediately. Keep your M-Pesa confirmation code for
                        reference.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === "paypal" && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <p className="text-blue-700 font-semibold">PayPal Payment:</p>
                    <p className="text-blue-600">
                      Payment link will be sent to your email after quote submission.
                    </p>
                  </div>
                )}

                {paymentMethod === "creditcard" && (
                  <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded">
                    <p className="text-purple-700 font-semibold mb-3 text-sm">
                      Secure Credit/Debit Card Payment
                    </p>

                    <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <p className="text-green-700 flex items-start gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Secure Payment:</strong> You'll be taken to our payment
                          partner's secure checkout page to enter your card details. We never
                          see or store your card number on our own servers.
                        </span>
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-purple-600">Accepted Cards:</span>
                      <div className="flex space-x-2 text-xs text-purple-600">
                        <span>VISA</span>
                        <span>•</span>
                        <span>Mastercard</span>
                        <span>•</span>
                        <span>American Express</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Payment terms: You can pay full amount or partial amount now via M-Pesa, PayPal, or Card
        </p>

        {paymentMethod === "creditcard" && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs">
            <p className="text-red-700 font-semibold mb-1 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Security Notice
            </p>
            <p className="text-red-600">
              • Card details are entered on our payment partner's secure checkout page, not on this site<br/>
              • We never see or store your full card number<br/>
              • Your payment is processed through a PCI-compliant payment gateway<br/>
              • You will receive email confirmation after successful payment
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
