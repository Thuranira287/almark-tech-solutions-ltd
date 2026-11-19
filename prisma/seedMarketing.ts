import process from "node:process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projects = [
  {
    name: "Almark Tech Solutions",
    website: "https://almarktechsolutions.co.ke",
    websiteVerified: true,
    description:
      "Nairobi-based technology company building websites, mobile apps, custom software, and security services for Kenyan businesses.",
    targetAudience: "Small and medium businesses and institutions in Kenya",
    brandVoice: "Professional, clear, practical, and honest about scope",
    contentPillars: ["Web and mobile development", "Cybersecurity", "IT consultancy", "Digital marketing"],
    preferredPlatforms: ["linkedin", "facebook", "x"],
    ctaDefault: "Get a quote",
  },
  {
    name: "TechBlog AI",
    website: "https://aitechblogs.netlify.app",
    websiteVerified: true,
    description: "Tutorials and guides on AI, web development, and technology trends.",
    targetAudience: "Developers and technology learners",
    brandVoice: "Educational and approachable",
    contentPillars: ["AI tutorials", "Web development guides", "Technology trends"],
    preferredPlatforms: ["linkedin", "x"],
    ctaDefault: "Read the full article",
  },
  {
    name: "NextGen Digital Hub",
    website: "https://almarktechsolutions.co.ke/portfolio",
    websiteVerified: false,
    description:
      "A community-based organization delivering digital literacy, coding, AI, and cybersecurity training to youth in Kenya.",
    targetAudience: "Youth, parents, and partner organizations in Kenya",
    brandVoice: "Encouraging, community-focused, and clear",
    contentPillars: ["Digital literacy", "Coding and AI skills", "Cybersecurity awareness"],
    preferredPlatforms: ["facebook", "instagram"],
    ctaDefault: "Learn more",
  },
  {
    name: "Tusome CBE",
    website: "https://almarktechsolutions.co.ke/portfolio",
    websiteVerified: false,
    description:
      "An AI tutor app for Kenya's CBC curriculum, grounded on KICD-sourced content, with offline-cached lessons.",
    targetAudience: "Parents, learners, and teachers in Kenya",
    brandVoice: "Supportive, simple, and education-focused",
    contentPillars: ["Learning tips", "CBC curriculum", "Study support"],
    preferredPlatforms: ["facebook", "instagram"],
    ctaDefault: "Learn more",
  },
];

async function main() {
  await prisma.platformMarketingSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "almark" },
    update: {},
    create: { name: "Almark Tech Solutions", slug: "almark", isPlatformOwner: true },
  });

  await prisma.tenantMarketingSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id },
  });

  for (const p of projects) {
    await prisma.marketingProject.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: p.name } },
      update: {},
      create: {
        ...p,
        tenantId: tenant.id,
        autonomyMode: "APPROVAL",
        active: true,
      },
    });
  }

  console.log(`Seeded tenant "${tenant.name}" (${tenant.id}) with ${projects.length} marketing projects.`);
  console.log("Automation is OFF platform-wide and for this tenant until you enable it in /admin.");
  console.log('Run "npm run admin:create -- you@example.com \\"password\\"" then add yourself as a member of this tenant if you are not a platform admin.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
