// scripts/generate-sitemap.ts
//
// Regenerates public/sitemap.xml from client/data/siteRoutes.ts — the
// single source of truth for public routes. Run automatically before every
// build (see the "build" script in package.json), so the sitemap can never
// drift out of sync with the routes actually in the app: add a route to
// siteRoutes.ts and it appears here on the next build, nothing to hand-edit.
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
