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
  Building,
  Loader2,
  Car,
  Hospital,
  HospitalIcon,
  FileText,
  IdCardIcon,
} from "lucide-react";
import { paymentService } from "@/lib/paymentService";
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
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "paypal" | "creditcard" | "bank" | "">(
    "",
  );
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [supportedBanks, setSupportedBanks] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<any>(null);

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

    //Online Cyber Services
    {
      id: "HELB Application",
      category: "Online Cyber Services",
      name: "HELB Application",
      description: "Apply for higher education loans with ease",
      icon: <GraduationCap className="h-5 w-5" />,
      basePrice: 200,
      priceRange: "KES 150 - 250",
    },
    {
      id: "NTSA Services",
      category: "Online Cyber Services",
      name: "NTSA Services",
      description: "Driving licenses application, Vehicle registration, Ownership transfer, Licenses renewal and more",
      icon: <Car className="h-5 w-5" />,
      basePrice: 3500,
      priceRange: "KES 3500 - 4500" ,
    },
    {
      id: "SHA Services",
      category: "Online Cyber Services",
      name: "SHA Insurance Application",
      description: "Afyayangu health application, contribution payments and statements checks, Facility selection, and more",
      icon: <HospitalIcon className="h-5 w-5"/>,
      basePrice: 300,
      priceRange: "KES 150 - 350",
    },
    {
      id: "KRA Services",
      category: "Online Cyber Services",
      name: "KRA Application",
      description: "KRA PIN Application, Filling returns, PIN retrival, Tax exemption and more.",
      icon: <FileText className="h-5 w-5"/>,
      basePrice: 250,
      priceRange: "KES 200 - 400",
    },
    {
      id: "Passport Application",
      category: "Online Cyber Services",
      name: "Passport Application",
      description: "Passport Application",
      icon:<IdCardIcon className="h-5 w-5"/>,
      basePrice: 1100,
      priceRange: "KES 1100 - 1500",
    },
    {
      id: "KUCCPS Services",
      category: "Online Cyber Services",
      name: "KUCCPS Application",
      description: "University, KMTC & TVET Application, Inter-Institution transfer, and more ",
      icon: <GraduationCap className="h-5 w-5"/>,
      basePrice: 400,
      priceRange: "KES 250 - 500",
    },
    {
      id: "Police Clearance Certificate",
      category: "Online Cyber Services",
      name: "Police Clearance Certificate",
      description: "Good conduct application, police abstract, and more",
      icon: <Shield className="h-5 w-5"/>,
      basePrice: 1200,
      priceRange: "KES 1100 - 1500"
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

  useEffect(() => {
    const calculatedBalance = totalPrice - paymentAmount;
    setBalance(calculatedBalance > 0 ? calculatedBalance : 0);
  }, [totalPrice, paymentAmount]);

  // Load payment methods and supported banks on component mount
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const [methodsResponse, banksResponse] = await Promise.all([
          paymentService.getPaymentMethods(),
          paymentService.getSupportedBanks()
        ]);

        if (methodsResponse.success) {
          setPaymentMethods(methodsResponse.data);
        }

        if (banksResponse.success) {
          setSupportedBanks(banksResponse.data);
        }
      } catch (error) {
        console.error('Failed to load payment data:', error);
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

    // Credit card validation
    if (paymentMethod === "creditcard" && paymentAmount > 0) {
      const cardNumber = (document.getElementById("cardNumber") as HTMLInputElement)?.value?.replace(/\s/g, '') || '';
      const expiryDate = (document.getElementById("expiryDate") as HTMLInputElement)?.value || '';
      const cvv = (document.getElementById("cvv") as HTMLInputElement)?.value || '';
      const cardName = (document.getElementById("cardName") as HTMLInputElement)?.value || '';

      if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
        alert("Please enter a valid card number");
        return;
      }
      if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
        alert("Please enter a valid expiry date (MM/YY)");
        return;
      }
      if (!cvv || cvv.length < 3 || cvv.length > 4) {
        alert("Please enter a valid CVV");
        return;
      }
      if (!cardName.trim()) {
        alert("Please enter the cardholder name");
        return;
      }

      // Additional security: Don't send full card details to backend
      console.log("⚠️ Credit card validation passed - In production, integrate with secure payment processor");
    }

    // Bank payment validation
    if (paymentMethod === "bank" && paymentAmount > 0) {
      if (!selectedBank) {
        alert("Please select a bank for payment");
        return;
      }
    }

    try {
      setIsProcessingPayment(true);
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
        paymentAmount,
        balance,
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
        // Process payment if amount > 0
        let paymentResult = null;
        let paymentSuccessMessage = "";

        if (paymentAmount > 0 && paymentMethod !== "creditcard") {
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
                    paymentSuccessMessage = "\n📱 Please complete M-Pesa payment manually:\n" +
                      "1. Go to M-Pesa menu\n" +
                      "2. Select 'Send Money'\n" +
                      "3. Enter: 0716227616\n" +
                      `4. Amount: KES ${paymentAmount.toLocaleString()}\n` +
                      `5. Reference: ${quoteId}\n` +
                      "6. Send confirmation SMS to +254716227616";
                  } else {
                    paymentSuccessMessage = "\n🔄 M-Pesa payment initiated! Check your phone for the payment prompt.";
                  }
                } else {
                  paymentSuccessMessage = `\n❌ M-Pesa payment failed: ${paymentResult.message}`;
                }
              } else {
                paymentSuccessMessage = "\n⚠️ M-Pesa payment cancelled - phone number required.";
              }
            } else if (paymentMethod === "paypal") {
              const usdAmount = paymentService.convertCurrency(paymentAmount, 'KES', 'USD');
              console.log('Initiating PayPal payment:', { usdAmount, quoteId });

              paymentResult = await paymentService.createPayPalPayment(
                usdAmount,
                quoteId,
                customerInfo
              );

              console.log('PayPal payment result:', paymentResult);

              if (paymentResult.success && paymentResult.data?.approvalUrl) {
                paymentSuccessMessage = "\n🔄 Redirecting to PayPal for payment...";
                setTimeout(() => {
                  window.open(paymentResult.data.approvalUrl, '_blank');
                }, 2000);
              } else {
                paymentSuccessMessage = `\n❌ PayPal payment failed: ${paymentResult.message}`;
              }
            } else if (paymentMethod === "bank") {
              console.log('Initiating bank payment:', { paymentAmount, quoteId, selectedBank });

              paymentResult = await paymentService.createBankPayment(
                paymentAmount,
                quoteId,
                customerInfo,
                selectedBank,
                'manual'
              );

              console.log('Bank payment result:', paymentResult);

              if (paymentResult.success) {
                paymentSuccessMessage = "\n🏦 Bank transfer instructions have been provided above. Please complete the transfer to proceed.";
              } else {
                paymentSuccessMessage = `\n❌ Bank payment setup failed: ${paymentResult.message}`;
              }
            }
          } catch (error) {
            console.error('Payment processing error:', error);
            paymentSuccessMessage = "\n⚠️ Payment processing encountered an issue. Please contact us for assistance.";
          }
        }

        // Show success message with WhatsApp option
        const paymentMessage =
          paymentAmount > 0
            ? `Amount to Pay: KES ${paymentAmount.toLocaleString()}\n` +
              `Balance Due: KES ${balance.toLocaleString()}\n`
            : "";

        const confirmed = confirm(
          `✅ Quote submitted successfully!\n\n` +
            `Quote ID: ${quoteId}\n` +
            `Total: KES ${totalPrice.toLocaleString()}\n` +
            paymentMessage +
            paymentSuccessMessage +
            `\n📧 Receipt sent to: ${customerInfo.email}\n\n` +
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
        setSelectedBank("");
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

                    {/* Payment Summary in Quote Summary */}
                    {paymentMethod && paymentAmount > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">
                              Amount Paying:
                            </span>
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
                    autoComplete="name"
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
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    autoComplete="tel"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="e.g., +254712345678"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    autoComplete="organization"
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="creditcard"
                    checked={paymentMethod === "creditcard"}
                    onCheckedChange={() =>
                      setPaymentMethod(
                        paymentMethod === "creditcard" ? "" : "creditcard",
                      )
                    }
                  />
                  <Label
                    htmlFor="creditcard"
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <span>Credit/Debit Card</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bank"
                    checked={paymentMethod === "bank"}
                    onCheckedChange={() =>
                      setPaymentMethod(
                        paymentMethod === "bank" ? "" : "bank",
                      )
                    }
                  />
                  <Label
                    htmlFor="bank"
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Building className="h-4 w-4 text-blue-800" />
                    <span>Bank Transfer</span>
                  </Label>
                </div>

                {/* Payment Amount Input - Shows when payment method is selected */}
                {paymentMethod && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <Label
                      htmlFor="paymentAmount"
                      className="text-sm font-semibold text-brand-dark"
                    >
                      Amount to Pay (KES)
                    </Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      value={paymentAmount || ""}
                      onChange={(e) =>
                        setPaymentAmount(Number(e.target.value) || 0)
                      }
                      placeholder="Enter amount to pay"
                      min="0"
                      max={totalPrice}
                      className="mt-2"
                    />

                    {/* Payment Summary */}
                    {paymentAmount > 0 && (
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Quote:</span>
                          <span className="font-semibold">
                            KES {totalPrice.toLocaleString()}
                          </span>
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
                            <p className="text-green-700 font-semibold">
                              M-Pesa Payment Instructions:
                            </p>
                            <p className="text-green-600">
                              1. Go to M-Pesa menu
                              <br />
                              2. Select "Send Money"
                              <br />
                              3. Enter: <strong>0716227616</strong> (Almark Tech
                              Solutions)
                              <br />
                              4. Amount:{" "}
                              <strong>
                                KES {paymentAmount.toLocaleString()}
                              </strong>
                              <br />
                              5. Complete payment
                              <br />
                              6.{" "}
                              <em>
                                Save M-Pesa confirmation message for your
                                records
                              </em>
                            </p>
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-yellow-700 text-xs">
                                <strong>Note:</strong> Payment will reflect in
                                Almark's account (0716227616) immediately. Keep
                                your M-Pesa confirmation code for reference.
                              </p>
                            </div>
                          </div>
                        )}

                        {paymentMethod === "paypal" && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <p className="text-blue-700 font-semibold">
                              PayPal Payment:
                            </p>
                            <p className="text-blue-600">
                              Payment link will be sent to your email after
                              quote submission.
                            </p>
                          </div>
                        )}

                        {paymentMethod === "creditcard" && (
                          <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded">
                            <p className="text-purple-700 font-semibold mb-3 text-sm">
                              Secure Credit/Debit Card Payment
                            </p>

                            {/* Security Notice */}
                            <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-xs">
                              <p className="text-green-700">
                                🔒 <strong>Secure Payment:</strong> Your card details are encrypted and processed securely.
                                We never store your complete card information.
                              </p>
                            </div>

                            {/* Credit Card Form */}
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="cardNumber" className="text-xs font-semibold text-purple-700">
                                  Card Number *
                                </Label>
                                <Input
                                  id="cardNumber"
                                  type="text"
                                  placeholder="1234 5678 9012 3456"
                                  maxLength={19}
                                  className="text-sm"
                                  onChange={(e) => {
                                    // Format card number with spaces
                                    let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                                    const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                                    e.target.value = formattedValue;
                                  }}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label htmlFor="expiryDate" className="text-xs font-semibold text-purple-700">
                                    Expiry Date *
                                  </Label>
                                  <Input
                                    id="expiryDate"
                                    type="text"
                                    placeholder="MM/YY"
                                    maxLength={5}
                                    className="text-sm"
                                    onChange={(e) => {
                                      // Format expiry date
                                      let value = e.target.value.replace(/\D/g, '');
                                      if (value.length >= 2) {
                                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                                      }
                                      e.target.value = value;
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="cvv" className="text-xs font-semibold text-purple-700">
                                    CVV *
                                  </Label>
                                  <Input
                                    id="cvv"
                                    type="password"
                                    placeholder="123"
                                    maxLength={4}
                                    className="text-sm"
                                    onChange={(e) => {
                                      // Only allow numbers
                                      e.target.value = e.target.value.replace(/[^0-9]/g, '');
                                    }}
                                  />
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="cardName" className="text-xs font-semibold text-purple-700">
                                  Cardholder Name *
                                </Label>
                                <Input
                                  id="cardName"
                                  type="text"
                                  placeholder="Name as shown on card"
                                  className="text-sm uppercase"
                                  onChange={(e) => {
                                    // Convert to uppercase and allow only letters and spaces
                                    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '');
                                  }}
                                />
                              </div>
                            </div>

                            {/* Payment Processor Notice */}
                            <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                              <p className="text-yellow-700">
                                <strong>Processing:</strong> Payments are securely processed through our certified payment partners.
                                Your transaction will appear as "Almark Tech Solutions" on your statement.
                              </p>
                            </div>

                            {/* Supported Cards */}
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-xs text-purple-600">Accepted Cards:</span>
                              <div className="flex space-x-2 text-xs text-purple-600">
                                <span>VISA</span>
                                <span>•</span>
                                <span>Mastercard</span>
                                <span>��</span>
                                <span>American Express</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {paymentMethod === "bank" && (
                          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-blue-700 font-semibold mb-3 text-sm">
                              🏦 Bank Transfer Payment
                            </p>

                            {/* Bank Selection */}
                            <div className="mb-4">
                              <Label htmlFor="bankSelect" className="text-xs font-semibold text-blue-700">
                                Select Your Bank *
                              </Label>
                              <select
                                id="bankSelect"
                                value={selectedBank}
                                onChange={(e) => setSelectedBank(e.target.value)}
                                className="w-full mt-2 p-2 border border-blue-300 rounded text-sm"
                                aria-label="Select your bank for payment"
                                required
                              >
                                <option value="">Choose your bank</option>
                                {supportedBanks.map((bank) => (
                                  <option key={bank.code} value={bank.code}>
                                    {bank.name} (Paybill: {bank.paybill})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Bank Transfer Instructions */}
                            {selectedBank && (
                              <div className="mt-3 p-3 bg-white border border-blue-200 rounded text-xs">
                                <p className="text-blue-700 font-semibold mb-2">
                                  Payment Instructions:
                                </p>
                                <div className="text-blue-600 space-y-1">
                                  <p>1. Open your {supportedBanks.find(b => b.code === selectedBank)?.name} mobile app or visit a branch</p>
                                  <p>2. Select "Pay Bill" or "Send Money to Paybill"</p>
                                  <p>3. Enter Paybill Number: <strong>{supportedBanks.find(b => b.code === selectedBank)?.paybill}</strong></p>
                                  <p>4. Enter Account Number: <strong>0716227616</strong> (Almark Tech Solutions)</p>
                                  <p>5. Enter Amount: <strong>KES {paymentAmount.toLocaleString()}</strong></p>
                                  <p>6. Enter Reference: <strong>ALM-{Date.now().toString().slice(-6)}</strong></p>
                                  <p>7. Confirm and complete the transaction</p>
                                  <p>8. Keep your transaction receipt for verification</p>
                                </div>
                              </div>
                            )}

                            {/* Bank Payment Notice */}
                            <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                              <p className="text-yellow-700">
                                <strong>Processing Time:</strong> Bank transfers are usually processed within 1-24 hours.
                                We'll confirm your payment once received and notify you via email.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Payment terms: You can pay full amount or partial amount now via M-Pesa, PayPal, Credit Card, or Bank Transfer
                </p>

                {paymentMethod === "creditcard" && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs">
                    <p className="text-red-700 font-semibold mb-1">🔒 Security Notice:</p>
                    <p className="text-red-600">
                      • All card transactions are encrypted using industry-standard SSL security<br/>
                      • We do not store your complete card information on our servers<br/>
                      • Your payment is processed through PCI-compliant payment gateways<br/>
                      �� You will receive email confirmation after successful payment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
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
