import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { quoteServices } from "@/data/quoteServices";
import { PaymentMethodChoice } from "@/hooks/useQuoteForm";

interface QuoteSummaryProps {
  selectedServices: string[];
  totalPrice: number;
  paymentMethod: PaymentMethodChoice;
  paymentAmount: number;
  balance: number;
}

export default function QuoteSummary({
  selectedServices,
  totalPrice,
  paymentMethod,
  paymentAmount,
  balance,
}: QuoteSummaryProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-brand-dark">Quote Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedServices.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No services selected</p>
        ) : (
          <div className="space-y-2">
            {selectedServices.map((serviceId) => {
              const service = quoteServices.find((s) => s.id === serviceId);
              return service ? (
                <div key={serviceId} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{service.name}</span>
                  <span className="font-semibold">KES {service.basePrice.toLocaleString()}</span>
                </div>
              ) : null;
            })}
            <Separator />
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span className="text-brand-gold">KES {totalPrice.toLocaleString()}</span>
            </div>

            {paymentMethod && paymentAmount > 0 && (
              <>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount Paying:</span>
                    <span className="font-semibold text-green-600">
                      KES {paymentAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Balance Due:</span>
                    <span className="font-semibold text-orange-600">
                      KES {balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}

            <p className="text-xs text-gray-500 mt-2">
              *Final price may vary based on specific requirements
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
