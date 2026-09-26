import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { siteRoutes, SITE_URL } from "../client/data/siteRoutes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function generateSitemap(): string {
  const today = new Date().toISOString().split("T")[0];
  const urls = siteRoutes
    .map(
      (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

const outPath = path.resolve(__dirname, "../public/sitemap.xml");
fs.writeFileSync(outPath, generateSitemap());
console.log(`Sitemap written to ${outPath} (${siteRoutes.length} URLs)`);
