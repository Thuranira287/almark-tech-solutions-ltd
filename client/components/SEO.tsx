import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/data/siteRoutes";

export interface BreadcrumbItem {
  label: string;
  path: string; 
}

interface SEOProps {
  title: string;
  description: string;
  path: string; 
  breadcrumbs?: BreadcrumbItem[]; 
  noindex?: boolean;
  image?: string; 
}

export default function SEO({ title, description, path, breadcrumbs, noindex, image }: SEOProps) {
  const canonicalUrl = `${SITE_URL}${path === "/" ? "" : path}`;
  const ogImage = image ? (image.startsWith("http") ? image : `${SITE_URL}${image}`) : `${SITE_URL}/social-preview.png`;

  const breadcrumbJsonLd = breadcrumbs
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.label,
          item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
        })),
      }
    : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {breadcrumbJsonLd && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      )}
    </Helmet>
  );
}
