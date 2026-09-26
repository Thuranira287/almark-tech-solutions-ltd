// prisma/seed.ts
// Seeds the services table from the same catalog previously hardcoded in
// client/pages/Quote.tsx. This becomes the single source of truth for
// pricing — the frontend now fetches this list instead of hardcoding it.
//
// Run with: npx prisma db seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  { id: "website-basic", category: "Core IT & Software", name: "Basic Website (5-10 pages)", description: "Static website with responsive design, contact forms, and basic SEO", basePrice: 25000, priceRange: "KES 25,000 - 50,000" },
  { id: "website-ecommerce", category: "Core IT & Software", name: "E-commerce Website", description: "Full online store with payment integration, inventory management", basePrice: 75000, priceRange: "KES 75,000 - 150,000" },
  { id: "mobile-app-basic", category: "Core IT & Software", name: "Basic Mobile App", description: "Simple Android app with core functionality", basePrice: 50000, priceRange: "KES 50,000 - 100,000" },
  { id: "mobile-app-advanced", category: "Core IT & Software", name: "Advanced Mobile App", description: "Complex app with backend integration, user accounts, push notifications", basePrice: 120000, priceRange: "KES 120,000 - 250,000" },
  { id: "custom-software", category: "Core IT & Software", name: "Custom Desktop Software", description: "School management, inventory, payroll systems", basePrice: 80000, priceRange: "KES 80,000 - 200,000" },
  { id: "database-setup", category: "Core IT & Software", name: "Database Design & Setup", description: "Database architecture, setup, and optimization", basePrice: 30000, priceRange: "KES 30,000 - 60,000" },
  { id: "it-support-monthly", category: "Core IT & Software", name: "Monthly IT Support", description: "Ongoing technical support, maintenance, and troubleshooting", basePrice: 15000, priceRange: "KES 15,000/month" },
  { id: "api-development", category: "Core IT & Software", name: "API Development & Integration", description: "Custom REST/GraphQL APIs and third-party integrations — payments, SMS, maps, and more", basePrice: 45000, priceRange: "KES 45,000 - 120,000" },
  { id: "cloud-hosting-setup", category: "Core IT & Software", name: "Cloud Hosting & Server Setup", description: "Server provisioning, deployment pipelines, and ongoing infrastructure management", basePrice: 20000, priceRange: "KES 20,000 - 60,000" },
  { id: "app-maintenance-plan", category: "Core IT & Software", name: "App Maintenance & Support Plan", description: "Ongoing bug fixes, updates, and monitoring for an existing website or app (Monthly)", basePrice: 12000, priceRange: "KES 12,000/month" },
  { id: "security-training", category: "Cybersecurity & Networking", name: "Cybersecurity Training (Per Session)", description: "Staff training on cybersecurity best practices", basePrice: 20000, priceRange: "KES 20,000 - 40,000" },
  { id: "vulnerability-testing", category: "Cybersecurity & Networking", name: "Security Assessment & Testing", description: "Comprehensive security audit and vulnerability testing", basePrice: 35000, priceRange: "KES 35,000 - 70,000" },
  { id: "code-audit", category: "Cybersecurity & Networking", name: "Code & Architecture Review", description: "An independent technical review of an existing codebase — code quality, scalability, and security, with a prioritized action plan", basePrice: 30000, priceRange: "KES 30,000 - 60,000" },
  { id: "network-setup", category: "Cybersecurity & Networking", name: "Network Design & Installation", description: "LAN/WiFi setup for offices and institutions", basePrice: 40000, priceRange: "KES 40,000 - 100,000" },
  { id: "ict-consultancy", category: "Consultancy & Training", name: "ICT Consultancy (Per Day)", description: "Strategic ICT planning and digital transformation consultation", basePrice: 12000, priceRange: "KES 12,000/day" },
  { id: "computer-training", category: "Consultancy & Training", name: "Computer Training Course", description: "MS Office, programming basics, web design training", basePrice: 8000, priceRange: "KES 8,000 - 15,000" },
  { id: "digital-marketing", category: "Business & Digital", name: "Digital Marketing Package", description: "Social media management, SEO, content creation (Monthly)", basePrice: 25000, priceRange: "KES 25,000/month" },
  { id: "graphic-design", category: "Business & Digital", name: "Graphic Design Package", description: "Logo, business cards, brochures, marketing materials", basePrice: 15000, priceRange: "KES 15,000 - 30,000" },
  { id: "ui-ux-design", category: "Business & Digital", name: "UI/UX Design (Web & Mobile)", description: "Wireframes, prototypes, and a full design system for a new or existing product", basePrice: 25000, priceRange: "KES 25,000 - 70,000" },
  { id: "business-automation", category: "Business & Digital", name: "Business Process Automation", description: "Automate repetitive workflows — invoicing, reporting, data entry — between the tools you already use", basePrice: 20000, priceRange: "KES 20,000 - 50,000" },
  { id: "HELB Application", category: "Online Cyber Services", name: "HELB Application", description: "Apply for higher education loans with ease", basePrice: 200, priceRange: "KES 150 - 250" },
  { id: "NTSA Services", category: "Online Cyber Services", name: "NTSA Services", description: "Driving licenses application, Vehicle registration, Ownership transfer, Licenses renewal and more", basePrice: 3500, priceRange: "KES 3500 - 4500" },
  { id: "SHA Services", category: "Online Cyber Services", name: "SHA Insurance Application", description: "Afyayangu health application, contribution payments and statements checks, Facility selection, and more", basePrice: 300, priceRange: "KES 150 - 350" },
  { id: "KRA Services", category: "Online Cyber Services", name: "KRA Application", description: "KRA PIN Application, Filling returns, PIN retrival, Tax exemption and more.", basePrice: 250, priceRange: "KES 200 - 400" },
  { id: "Passport Application", category: "Online Cyber Services", name: "Passport Application", description: "Passport Application", basePrice: 1100, priceRange: "KES 1100 - 1500" },
  { id: "KUCCPS Services", category: "Online Cyber Services", name: "KUCCPS Application", description: "University, KMTC & TVET Application, Inter-Institution transfer, and more ", basePrice: 400, priceRange: "KES 250 - 500" },
  { id: "Police Clearance Certificate", category: "Online Cyber Services", name: "Police Clearance Certificate", description: "Good conduct application, police abstract, and more", basePrice: 1200, priceRange: "KES 1100 - 1500" },
];

async function main() {
  for (const s of services) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: { ...s, active: true },
      create: { ...s, active: true },
    });
  }
  console.log(`Seeded ${services.length} services.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
