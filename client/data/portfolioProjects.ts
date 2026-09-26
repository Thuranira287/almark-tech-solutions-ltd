export interface PortfolioProject {
  name: string;
  tagline: string;
  description: string;
  image?: string;
  url?: string;
  category: string;
}

export const portfolioProjects: PortfolioProject[] = [
  {
    name: "Almark Tech Solutions",
    tagline: "This website",
    description:
      "Our own platform — service quoting, secure payments (M-Pesa, PayPal, card), and client project sourcing.",
    image: "/almark-logo.jpg",
    url: "https://almarktechsolutions.co.ke",
    category: "Web Platform",
  },
  {
    name: "TechBlog AI",
    tagline: "AI tutorials & web development guides",
    description:
      "A content platform publishing tutorials and guides on AI, web development, and technology trends.",
    url: "https://aitechblogs.netlify.app",
    category: "Web Platform",
  },
  {
    name: "Tusome CBE",
    tagline: "Learn · Practice · Progress",
    description:
      "An AI tutor app for Kenya's CBC curriculum, grounded on real KICD-sourced content — the AI is scoped to reviewer-approved material per lesson unit, not free-form answers. Built cross-platform (Android, iOS, desktop) with offline-cached lessons for low-connectivity areas.",
    image: "/portfolio/tusome-cbe.jpg",
    category: "Mobile App",
  },
  {
    name: "School MIS Pro",
    tagline: "School management, simplified",
    description:
      "An offline-first School Management Information System for Kenya's CBC curriculum — one codebase running as a web app, desktop app, and Android app, with optional cloud sync for schools that want it.",
    image: "/portfolio/school-mis-pro.jpg",
    category: "Software",
  },
  {
    name: "PixCraft AI",
    tagline: "Photo editor, enhancer & poster maker",
    description:
      "An AI-powered Android photo editor — deblur, face restoration, background removal, colorization, and text-guided edits, plus a passport-photo and poster maker. Built with Kotlin and Jetpack Compose, with M-Pesa, PayPal, and Play Billing built in.",
    image: "/portfolio/pixcraft-ai.png",
    category: "Mobile App",
  },
  {
    name: "PhotonDrop",
    tagline: "Share at the speed of light",
    description:
      "A privacy-first Android file-transfer app — encrypted, offline-capable transfers with no account required and no silent cloud upload.",
    image: "/portfolio/photondrop.png",
    category: "Mobile App",
  },
  {
    name: "Introvert Corner",
    tagline: "A quiet corner, built for you",
    description:
      "A social platform for introverts to connect, build social confidence with AI-assisted guidance, and track their mood — with a web app and a native Android/iOS app.",
    image: "/portfolio/introvert-corner.png",
    category: "Web & Mobile Platform",
  },
  {
    name: "NextGen Digital Hub",
    tagline: "Learn · Innovate · Empower",
    description:
      "A full platform for a Community-Based Organization delivering digital literacy, coding, AI, and cybersecurity training to youth in Kenya — course enrollment, progress tracking, and digitally-signed, independently verifiable certificates, plus donations and payments (M-Pesa, Airtel Money, Stripe, PayPal). NestJS/PostgreSQL backend behind a fast, fully search-indexable static frontend.",
    image: "/portfolio/nextgen-digital-hub.png",
    category: "Web Platform",
  },
];
