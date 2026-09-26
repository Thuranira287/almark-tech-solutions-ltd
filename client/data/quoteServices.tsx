import {
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
  Car,
  HospitalIcon,
  FileText,
  IdCardIcon,
} from "lucide-react";

export interface Service {
  id: string;
  category: string;
  name: string;
  description: string;
  icon: JSX.Element;
  basePrice: number;
  priceRange: string;
}

// Display 
export const quoteServices: Service[] = [
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
  {
    id: "api-development",
    category: "Core IT & Software",
    name: "API Development & Integration",
    description:
      "Custom REST/GraphQL APIs and third-party integrations — payments, SMS, maps, and more",
    icon: <Code className="h-5 w-5" />,
    basePrice: 45000,
    priceRange: "KES 45,000 - 120,000",
  },
  {
    id: "cloud-hosting-setup",
    category: "Core IT & Software",
    name: "Cloud Hosting & Server Setup",
    description:
      "Server provisioning, deployment pipelines, and ongoing infrastructure management",
    icon: <Database className="h-5 w-5" />,
    basePrice: 20000,
    priceRange: "KES 20,000 - 60,000",
  },
  {
    id: "app-maintenance-plan",
    category: "Core IT & Software",
    name: "App Maintenance & Support Plan",
    description:
      "Ongoing bug fixes, updates, and monitoring for an existing website or app (Monthly)",
    icon: <Settings className="h-5 w-5" />,
    basePrice: 12000,
    priceRange: "KES 12,000/month",
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
    id: "code-audit",
    category: "Cybersecurity & Networking",
    name: "Code & Architecture Review",
    description:
      "An independent technical review of an existing codebase — code quality, scalability, and security, with a prioritized action plan",
    icon: <Code className="h-5 w-5" />,
    basePrice: 30000,
    priceRange: "KES 30,000 - 60,000",
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
  {
    id: "ui-ux-design",
    category: "Business & Digital",
    name: "UI/UX Design (Web & Mobile)",
    description:
      "Wireframes, prototypes, and a full design system for a new or existing product",
    icon: <Palette className="h-5 w-5" />,
    basePrice: 25000,
    priceRange: "KES 25,000 - 70,000",
  },
  {
    id: "business-automation",
    category: "Business & Digital",
    name: "Business Process Automation",
    description:
      "Automate repetitive workflows — invoicing, reporting, data entry — between the tools you already use",
    icon: <Settings className="h-5 w-5" />,
    basePrice: 20000,
    priceRange: "KES 20,000 - 50,000",
  },

  // Online Cyber Services
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
    description:
      "Driving licenses application, Vehicle registration, Ownership transfer, Licenses renewal and more",
    icon: <Car className="h-5 w-5" />,
    basePrice: 3500,
    priceRange: "KES 3500 - 4500",
  },
  {
    id: "SHA Services",
    category: "Online Cyber Services",
    name: "SHA Insurance Application",
    description:
      "Afyayangu health application, contribution payments and statements checks, Facility selection, and more",
    icon: <HospitalIcon className="h-5 w-5" />,
    basePrice: 300,
    priceRange: "KES 150 - 350",
  },
  {
    id: "KRA Services",
    category: "Online Cyber Services",
    name: "KRA Application",
    description:
      "KRA PIN Application, Filling returns, PIN retrival, Tax exemption and more.",
    icon: <FileText className="h-5 w-5" />,
    basePrice: 250,
    priceRange: "KES 200 - 400",
  },
  {
    id: "Passport Application",
    category: "Online Cyber Services",
    name: "Passport Application",
    description: "Passport Application",
    icon: <IdCardIcon className="h-5 w-5" />,
    basePrice: 1100,
    priceRange: "KES 1100 - 1500",
  },
  {
    id: "KUCCPS Services",
    category: "Online Cyber Services",
    name: "KUCCPS Application",
    description:
      "University, KMTC & TVET Application, Inter-Institution transfer, and more ",
    icon: <GraduationCap className="h-5 w-5" />,
    basePrice: 400,
    priceRange: "KES 250 - 500",
  },
  {
    id: "Police Clearance Certificate",
    category: "Online Cyber Services",
    name: "Police Clearance Certificate",
    description: "Good conduct application, police abstract, and more",
    icon: <Shield className="h-5 w-5" />,
    basePrice: 1200,
    priceRange: "KES 1100 - 1500",
  },
];

export function groupServicesByCategory(services: Service[]) {
  return services.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<string, Service[]>,
  );
}
