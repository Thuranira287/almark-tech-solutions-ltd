export interface SiteRoute {
  path: string;
  label: string; // breadcrumb / nav label
  title: string; // <title> 
  description: string; // meta description
  priority: number; 
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
}

export const SITE_URL = "https://almarktechsolutions.co.ke";

export const siteRoutes: SiteRoute[] = [
  {
    path: "/",
    label: "Home",
    title: "Almark Tech Solutions — Web, Mobile & Security Development in Kenya",
    description:
      "Almark Tech Solutions builds websites, mobile apps, and custom software for Kenyan businesses — plus cybersecurity assessments, IT support, and digital marketing.",
    priority: 1.0,
    changefreq: "weekly",
  },
  {
    path: "/quote",
    label: "Get a Quote",
    title: "Get a Quote — Almark Tech Solutions",
    description:
      "Select the services you need and get an instant, itemized quote for your website, app, or IT project — pay via M-Pesa, PayPal, or card.",
    priority: 0.9,
    changefreq: "monthly",
  },
  {
    path: "/portfolio",
    label: "Our Work",
    title: "Our Work — Almark Tech Solutions",
    description:
      "Real projects built by Almark Tech Solutions, from live web platforms to mobile apps for education, productivity, and community learning.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/testimonials",
    label: "Reviews",
    title: "Client Reviews — Almark Tech Solutions",
    description: "Read what people we've worked with say, or leave a review of your own experience with Almark Tech Solutions.",
    priority: 0.7,
    changefreq: "weekly",
  },
  {
    path: "/technology",
    label: "Technology",
    title: "Technology We Use — Almark Tech Solutions",
    description:
      "The frameworks, platforms, and security practices Almark Tech Solutions uses to build web, mobile, and software projects for clients.",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    path: "/about",
    label: "About",
    title: "About Us — Almark Tech Solutions",
    description: "Learn about Almark Tech Solutions, a Nairobi-based technology company building web, mobile, and IT solutions for Kenyan businesses.",
    priority: 0.6,
    changefreq: "monthly",
  },
  {
    path: "/contact",
    label: "Contact",
    title: "Contact Us — Almark Tech Solutions",
    description: "Get in touch with Almark Tech Solutions by phone, WhatsApp, or email to discuss your website, app, or IT project.",
    priority: 0.6,
    changefreq: "monthly",
  },
  {
    path: "/privacy-policy",
    label: "Privacy Policy",
    title: "Privacy Policy — Almark Tech Solutions",
    description: "How Almark Tech Solutions collects, uses, and protects your information.",
    priority: 0.3,
    changefreq: "yearly",
  },
  {
    path: "/terms-of-service",
    label: "Terms of Service",
    title: "Terms of Service — Almark Tech Solutions",
    description: "The terms governing use of Almark Tech Solutions' website and services.",
    priority: 0.3,
    changefreq: "yearly",
  },
];
