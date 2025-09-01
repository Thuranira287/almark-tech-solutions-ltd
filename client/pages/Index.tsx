import {
  ArrowRight,
  CheckCircle,
  Code,
  Shield,
  Users,
  Briefcase,
  Monitor,
  Smartphone,
  Database,
  Settings,
  Globe,
  Lock,
  GraduationCap,
  BarChart3,
  Palette,
  ShoppingCart,
  ChevronRight,
  MessageCircle,
  ExternalLink,
  Calendar,
  Star,
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

export default function Index() {
  const coreServices = [
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Website Design and Development",
      description:
        "Static and dynamic websites, e-commerce platforms, personal/portfolio sites, and CMS setup (WordPress)",
      features: [
        "Responsive Design",
        "E-commerce Integration",
        "SEO Optimized",
        "CMS Solutions",
      ],
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile App Development",
      description:
        "Android app development using Java/Kotlin or Flutter, and hybrid apps using React Native",
      features: [
        "Native Android Apps",
        "Cross-Platform Solutions",
        "Flutter Development",
        "React Native",
      ],
    },
    {
      icon: <Code className="h-8 w-8" />,
      title: "Custom Software Development",
      description:
        "Desktop applications for schools, inventory systems, payroll, and business automation tools",
      features: [
        "Desktop Applications",
        "School Systems",
        "Inventory Management",
        "Business Automation",
      ],
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: "Database Design & Management",
      description:
        "MySQL, PostgreSQL, SQLite solutions with data migration and backup automation",
      features: [
        "Database Design",
        "Data Migration",
        "Backup Solutions",
        "Performance Optimization",
      ],
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "IT Support & Maintenance",
      description:
        "System troubleshooting, PC formatting, software installation, and network setup (LAN, Wi-Fi)",
      features: [
        "System Troubleshooting",
        "Software Installation",
        "Network Setup",
        "Maintenance Plans",
      ],
    },
  ];

  const securityServices = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Cybersecurity Awareness Training",
      description:
        "Educate SMEs and schools on safe IT practices and security protocols",
    },
    {
      icon: <Lock className="h-8 w-8" />,
      title: "Ethical Hacking & Vulnerability Testing",
      description:
        "Scan and secure local websites or systems with professional testing",
    },
    {
      icon: <Monitor className="h-8 w-8" />,
      title: "Network Design and Installation",
      description: "Professional setup for offices, schools, and institutions",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Firewall & Antivirus Solutions",
      description:
        "Recommend, install, and configure comprehensive security tools",
    },
  ];

  const consultancyServices = [
    {
      icon: <Briefcase className="h-8 w-8" />,
      title: "ICT Consultancy for SMEs",
      description:
        "Help small businesses digitize their operations and improve efficiency",
    },
    {
      icon: <GraduationCap className="h-8 w-8" />,
      title: "Computer Training",
      description:
        "Short courses on MS Office, Python/Java basics, and web design (HTML/CSS/JavaScript)",
    },
    {
      icon: <Code className="h-8 w-8" />,
      title: "Coding Bootcamps for Youth",
      description:
        "Weekend/holiday programs to teach coding and essential tech skills",
    },
  ];

  const businessServices = [
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Digital Marketing",
      description:
        "Social media management, SEO for local businesses, content writing and blogging",
    },
    {
      icon: <Palette className="h-8 w-8" />,
      title: "Graphic Design",
      description: "Professional logos, flyers, business cards, and brochures",
    },
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: "IT Equipment Sales and Installation",
      description:
        "Resell computers, printers, routers, and provide installation services",
    },
    {
      icon: <Monitor className="h-8 w-8" />,
      title: "Computerized Systems for Businesses",
      description:
        "POS systems, inventory management, and school management systems",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-dark via-brand-dark-light to-gray-900 text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src="/Almark logo.jpg"
                  //src="https://cdn.builder.io/api/v1/assets/71f0184882c4419c9eb0eea502d5d8ef/img-20250411-wa0001-9983c9?format=webp&width=800"
                  alt="Almark Tech Solutions"
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-brand-gold">
                    Almark Tech Solutions
                  </h1>
                  <p className="text-xl text-brand-gold-light italic underline">
                    Your Tech Partner
                  </p>
                </div>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6 leading-tight">
                Empowering Your Business with
                <span className="text-brand-gold"> Innovative Technology</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                From website development to cybersecurity, we provide
                comprehensive IT solutions that help businesses thrive in the
                digital world. Let's transform your ideas into reality.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/quote">
                  <Button
                    size="lg"
                    className="bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold"
                  >
                    Get Started Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#services">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark"
                  >
                    View Our Services
                  </Button>
                </a>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-brand-gold to-brand-tech-blue rounded-lg blur opacity-30"></div>
                <div className="relative bg-white rounded-lg p-8 shadow-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-brand-gold/10 rounded-lg">
                      <Globe className="h-8 w-8 text-brand-gold mx-auto mb-2" />
                      <p className="text-brand-dark font-semibold">
                        Web Development
                      </p>
                    </div>
                    <div className="text-center p-4 bg-brand-tech-blue/10 rounded-lg">
                      <Smartphone className="h-8 w-8 text-brand-tech-blue mx-auto mb-2" />
                      <p className="text-brand-dark font-semibold">
                        Mobile Apps
                      </p>
                    </div>
                    <div className="text-center p-4 bg-brand-tech-green/10 rounded-lg">
                      <Shield className="h-8 w-8 text-brand-tech-green mx-auto mb-2" />
                      <p className="text-brand-dark font-semibold">
                        Cybersecurity
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-100 rounded-lg">
                      <GraduationCap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-brand-dark font-semibold">Training</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core IT & Software Services */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-4">
              🔧 Core IT & Software Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive technology solutions to power your business
              operations and digital presence
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreServices.map((service, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-brand-gold"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="text-brand-gold">{service.icon}</div>
                    <CardTitle className="text-lg text-brand-dark">
                      {service.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    {service.description}
                  </CardDescription>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-brand-tech-green" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cybersecurity & Networking Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-4">
              🔐 Cybersecurity & Networking Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Protect your digital assets with our comprehensive security and
              networking solutions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityServices.map((service, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-brand-tech-blue"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="text-brand-tech-blue">{service.icon}</div>
                    <CardTitle className="text-lg text-brand-dark">
                      {service.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Consultancy & Training Services */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-4">
              🧠 Consultancy & Training Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Empower your team with expert knowledge and strategic guidance
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {consultancyServices.map((service, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-brand-tech-green"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="text-brand-tech-green">{service.icon}</div>
                    <CardTitle className="text-lg text-brand-dark">
                      {service.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business & Digital Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-4">
              💼 Business & Digital Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete digital transformation solutions for modern businesses
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {businessServices.map((service, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="text-purple-600">{service.icon}</div>
                    <CardTitle className="text-lg text-brand-dark">
                      {service.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Completed Projects */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-4">
              🏆 Our Completed Projects
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how we've helped our clients transform their businesses with
              innovative technology solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* School Management System */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-brand-tech-blue overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <div className="text-white text-center">
                  <GraduationCap className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold">EduManage Pro</h3>
                  <p className="text-blue-100">School Management System</p>
                </div>
                <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Completed
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg text-brand-dark flex items-center">
                  <Database className="h-5 w-5 mr-2 text-brand-tech-blue" />
                  Comprehensive School Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">
                    Complete school management solution with student records,
                    attendance tracking, grade management, fee collection, and
                    parent communication portal.
                  </p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-brand-dark text-sm">
                      Key Features:
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Student & Staff Management
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Automated Fee Collection
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Parent Communication Portal
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Real-time Reports & Analytics
                      </li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Completed: Dec 2023
                    </div>
                    <div className="flex items-center text-xs text-brand-tech-blue">
                      <Code className="h-3 w-3 mr-1" />
                      Desktop + Web
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Corporate Website */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-brand-gold overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-brand-gold to-yellow-600 flex items-center justify-center">
                <div className="text-white text-center">
                  <Globe className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold">Corporate Website</h3>
                  <p className="text-yellow-100">Professional Business Site</p>
                </div>
                <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Completed
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg text-brand-dark flex items-center">
                  <Monitor className="h-5 w-5 mr-2 text-brand-gold" />
                  Modern Corporate Website
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">
                    Professional corporate website with modern design, content
                    management system, SEO optimization, and lead generation
                    capabilities.
                  </p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-brand-dark text-sm">
                      Key Features:
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Responsive Design
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Content Management System
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        SEO Optimization
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Contact Forms & Analytics
                      </li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Completed: Jan 2024
                    </div>
                    <div className="flex items-center text-xs text-brand-gold">
                      <Globe className="h-3 w-3 mr-1" />
                      Web + Mobile
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lady Cosmetics E-commerce */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-pink-500 overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <div className="text-white text-center">
                  <Palette className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold">Beauty Boutique</h3>
                  <p className="text-pink-100">Cosmetics E-commerce</p>
                </div>
                <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Completed
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg text-brand-dark flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-pink-500" />
                  Premium Cosmetics Store
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">
                    Elegant e-commerce platform for cosmetics and makeup
                    products with advanced product catalog, secure payments, and
                    beauty consultation features.
                  </p>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-brand-dark text-sm">
                      Key Features:
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Product Catalog & Search
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        M-Pesa & PayPal Integration
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Beauty Consultation Booking
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        Inventory & Order Management
                      </li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Completed: Nov 2023
                    </div>
                    <div className="flex items-center text-xs text-pink-500">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      E-commerce
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">
              Want to see more of our work or discuss your project?
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/quote">
                <Button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold">
                  Start Your Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a
                href="https://wa.me/254716227616?text=Hello%20Almark%20Tech%20Solutions,%20I'd%20like%20to%20see%20more%20of%20your%20portfolio"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white"
                >
                  View Full Portfolio
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-brand-dark to-brand-dark-light text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Get in touch with our expert team to discuss your technology needs
            and discover how we can help you achieve your digital goals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/quote">
              <Button
                size="lg"
                className="bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold"
              >
                Get Free Consultation
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="tel:+254716227616">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-brand-dark"
              >
                Call Us Now: +254716227616
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/254716227616?text=Hello%20Almark%20Tech%20Solutions,%20I'm%20interested%20in%20your%20services"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
