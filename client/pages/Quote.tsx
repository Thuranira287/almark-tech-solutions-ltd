import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Globe,
  Smartphone,
  Code,
  Database,
  Settings,
  Shield,
  Lock,
  Monitor,
  Briefcase,
  GraduationCap,
  BarChart3,
  Palette,
  ShoppingCart,
  CreditCard,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface Service {
  id: string;
  category: string;
  name: string;
  description: string;
  icon: JSX.Element;
  basePrice: number;
  priceRange: string;
}

export default function Quote() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "paypal" | "">(
    "",
  );
  const [totalPrice, setTotalPrice] = useState(0);

  const services: Service[] = [
    // Core IT & Software Services
    {
      id: "website-basic",
      category: "Core IT & Software",
      name: "Basic Website (5-10 pages)",
      description:
        "Static website with responsive design, contact forms, and basic SEO",
      icon: <Globe className="h-5 w-5" />,
      basePrice: 25000,
      priceRange: "KES 25,000 - 50,000",
    },
    {
      id: "website-ecommerce",
      category: "Core IT & Software",
      name: "E-commerce Website",
      description:
        "Full online store with payment integration, inventory management",
      icon: <ShoppingCart className="h-5 w-5" />,
      basePrice: 75000,
      priceRange: "KES 75,000 - 150,000",
    },
    {
      id: "mobile-app-basic",
      category: "Core IT & Software",
      name: "Basic Mobile App",
      description: "Simple Android app with core functionality",
      icon: <Smartphone className="h-5 w-5" />,
      basePrice: 50000,
      priceRange: "KES 50,000 - 100,000",
    },
    {
      id: "mobile-app-advanced",
      category: "Core IT & Software",
      name: "Advanced Mobile App",
      description:
        "Complex app with backend integration, user accounts, push notifications",
      icon: <Smartphone className="h-5 w-5" />,
      basePrice: 120000,
      priceRange: "KES 120,000 - 250,000",
    },
    {
      id: "custom-software",
      category: "Core IT & Software",
      name: "Custom Desktop Software",
      description: "School management, inventory, payroll systems",
      icon: <Code className="h-5 w-5" />,
      basePrice: 80000,
      priceRange: "KES 80,000 - 200,000",
    },
    {
      id: "database-setup",
      category: "Core IT & Software",
      name: "Database Design & Setup",
      description: "Database architecture, setup, and optimization",
      icon: <Database className="h-5 w-5" />,
      basePrice: 30000,
      priceRange: "KES 30,000 - 60,000",
    },
    {
      id: "it-support-monthly",
      category: "Core IT & Software",
      name: "Monthly IT Support",
      description:
        "Ongoing technical support, maintenance, and troubleshooting",
      icon: <Settings className="h-5 w-5" />,
      basePrice: 15000,
      priceRange: "KES 15,000/month",
    },

    // Cybersecurity & Networking
    {
      id: "security-training",
      category: "Cybersecurity & Networking",
      name: "Cybersecurity Training (Per Session)",
      description: "Staff training on cybersecurity best practices",
      icon: <Shield className="h-5 w-5" />,
      basePrice: 20000,
      priceRange: "KES 20,000 - 40,000",
    },
    {
      id: "vulnerability-testing",
      category: "Cybersecurity & Networking",
      name: "Security Assessment & Testing",
      description: "Comprehensive security audit and vulnerability testing",
      icon: <Lock className="h-5 w-5" />,
      basePrice: 35000,
      priceRange: "KES 35,000 - 70,000",
    },
    {
      id: "network-setup",
      category: "Cybersecurity & Networking",
      name: "Network Design & Installation",
      description: "LAN/WiFi setup for offices and institutions",
      icon: <Monitor className="h-5 w-5" />,
      basePrice: 40000,
      priceRange: "KES 40,000 - 100,000",
    },

    // Consultancy & Training
    {
      id: "ict-consultancy",
      category: "Consultancy & Training",
      name: "ICT Consultancy (Per Day)",
      description:
        "Strategic ICT planning and digital transformation consultation",
      icon: <Briefcase className="h-5 w-5" />,
      basePrice: 12000,
      priceRange: "KES 12,000/day",
    },
    {
      id: "computer-training",
      category: "Consultancy & Training",
      name: "Computer Training Course",
      description: "MS Office, programming basics, web design training",
      icon: <GraduationCap className="h-5 w-5" />,
      basePrice: 8000,
      priceRange: "KES 8,000 - 15,000",
    },

    // Business & Digital Services
    {
      id: "digital-marketing",
      category: "Business & Digital",
      name: "Digital Marketing Package",
      description: "Social media management, SEO, content creation (Monthly)",
      icon: <BarChart3 className="h-5 w-5" />,
      basePrice: 25000,
      priceRange: "KES 25,000/month",
    },
    {
      id: "graphic-design",
      category: "Business & Digital",
      name: "Graphic Design Package",
      description: "Logo, business cards, brochures, marketing materials",
      icon: <Palette className="h-5 w-5" />,
      basePrice: 15000,
      priceRange: "KES 15,000 - 30,000",
    },
  ];

  const servicesByCategory = services.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<string, Service[]>,
  );

  useEffect(() => {
    const total = selectedServices.reduce((sum, serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return sum + (service?.basePrice || 0);
    }, 0);
    setTotalPrice(total);
  }, [selectedServices]);

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
      // Generate quote ID
      const quoteId = `ALM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Prepare selected services data
      const selectedServicesData = selectedServices
        .map((serviceId) => {
          const service = services.find((s) => s.id === serviceId);
          return service
            ? {
                id: service.id,
                name: service.name,
                description: service.description,
                price: service.basePrice,
              }
            : null;
        })
        .filter(Boolean);

      // Prepare quote data
      const quoteData = {
        customerInfo,
        selectedServices: selectedServicesData,
        totalPrice,
        paymentMethod,
        quoteId,
      };

      // Send quote and receipt to backend
      const response = await fetch("/api/send-quote-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quoteData),
      });

      const result = await response.json();

      if (result.success) {
        // Show success message with WhatsApp option
        const confirmed = confirm(
          `✅ Quote submitted successfully!\n\n` +
            `Quote ID: ${quoteId}\n` +
            `Total: KES ${totalPrice.toLocaleString()}\n` +
            `📧 Receipt sent to: ${customerInfo.email}\n\n` +
            `We'll contact you within 24 hours.\n\n` +
            `Would you like to continue the conversation on WhatsApp?`,
        );

        if (confirmed) {
          const whatsappMessage = encodeURIComponent(
            `Hello Almark Tech Solutions! I just submitted a quote request.\n\n` +
              `Quote ID: ${quoteId}\n` +
              `Total: KES ${totalPrice.toLocaleString()}\n\n` +
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
      } else {
        alert(
          "Error submitting quote. Please try again or contact us directly.",
        );
      }
    } catch (error) {
      console.error("Error submitting quote:", error);
      alert("Error submitting quote. Please try again or contact us directly.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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
          {/* Services Selection */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(servicesByCategory).map(
              ([category, categoryServices]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-xl text-brand-dark">
                      {category}
                    </CardTitle>
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
                          onCheckedChange={() =>
                            handleServiceToggle(service.id)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={service.id}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="text-brand-gold">
                                {service.icon}
                              </div>
                              <h4 className="font-semibold text-brand-dark">
                                {service.name}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {service.description}
                            </p>
                            <p className="text-sm font-semibold text-brand-gold">
                              {service.priceRange}
                            </p>
                          </Label>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ),
            )}
          </div>

          {/* Quote Summary & Contact Form */}
          <div className="space-y-6">
            {/* Quote Summary */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-brand-dark">Quote Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedServices.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No services selected
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedServices.map((serviceId) => {
                      const service = services.find((s) => s.id === serviceId);
                      return service ? (
                        <div
                          key={serviceId}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-600">{service.name}</span>
                          <span className="font-semibold">
                            KES {service.basePrice.toLocaleString()}
                          </span>
                        </div>
                      ) : null;
                    })}
                    <Separator />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-brand-gold">
                        KES {totalPrice.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      *Final price may vary based on specific requirements
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-brand-dark">
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="e.g., +254712345678"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    value={customerInfo.company}
                    onChange={(e) =>
                      handleInputChange("company", e.target.value)
                    }
                    placeholder="Enter company name (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Additional Requirements</Label>
                  <Textarea
                    id="message"
                    value={customerInfo.message}
                    onChange={(e) =>
                      handleInputChange("message", e.target.value)
                    }
                    placeholder="Tell us more about your specific needs..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-brand-dark">
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mpesa"
                    checked={paymentMethod === "mpesa"}
                    onCheckedChange={() =>
                      setPaymentMethod(paymentMethod === "mpesa" ? "" : "mpesa")
                    }
                  />
                  <Label
                    htmlFor="mpesa"
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Phone className="h-4 w-4 text-green-600" />
                    <span>M-Pesa</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="paypal"
                    checked={paymentMethod === "paypal"}
                    onCheckedChange={() =>
                      setPaymentMethod(
                        paymentMethod === "paypal" ? "" : "paypal",
                      )
                    }
                  />
                  <Label
                    htmlFor="paypal"
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span>PayPal</span>
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  Payment terms: 50% upfront, 50% on completion
                </p>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitQuote}
              className="w-full bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold py-3"
              size="lg"
            >
              Submit Quote Request
            </Button>

            {/* Contact Info */}
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
