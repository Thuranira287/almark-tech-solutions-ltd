import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomerInfo } from "@/hooks/useQuoteForm";

interface CustomerInfoCardProps {
  customerInfo: CustomerInfo;
  onChange: (field: string, value: string) => void;
}

export default function CustomerInfoCard({ customerInfo, onChange }: CustomerInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-dark">Your Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={customerInfo.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={customerInfo.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            autoComplete="tel"
            value={customerInfo.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="e.g., +254712345678"
          />
        </div>
        <div>
          <Label htmlFor="company">Company/Organization</Label>
          <Input
            id="company"
            autoComplete="organization"
            value={customerInfo.company}
            onChange={(e) => onChange("company", e.target.value)}
            placeholder="Enter company name (optional)"
          />
        </div>
        <div>
          <Label htmlFor="message">Additional Requirements</Label>
          <Textarea
            id="message"
            value={customerInfo.message}
            onChange={(e) => onChange("message", e.target.value)}
            placeholder="Tell us more about your specific needs..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
