import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { quoteServices, groupServicesByCategory } from "@/data/quoteServices";

interface ServiceSelectionProps {
  selectedServices: string[];
  onToggle: (serviceId: string) => void;
}

export default function ServiceSelection({ selectedServices, onToggle }: ServiceSelectionProps) {
  const servicesByCategory = groupServicesByCategory(quoteServices);

  return (
    <div className="lg:col-span-2 space-y-6">
      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-xl text-brand-dark">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryServices.map((service) => (
              <div
                key={service.id}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  id={service.id}
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={() => onToggle(service.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor={service.id} className="cursor-pointer">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="text-brand-gold">{service.icon}</div>
                      <h4 className="font-semibold text-brand-dark">{service.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{service.description}</p>
                    <p className="text-sm font-semibold text-brand-gold">{service.priceRange}</p>
                  </Label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
