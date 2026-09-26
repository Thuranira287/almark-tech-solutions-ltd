import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { siteRoutes } from "@/data/siteRoutes";

interface PageHeadProps {
  path: string; // must match a path in client/data/siteRoutes.ts
  showBreadcrumbs?: boolean; // default true; set false for Home
}

// Drop this at the top of every public page's returned JSX. It looks up
// title/description/breadcrumb-label from siteRoutes.ts, so there's exactly
// one place (siteRoutes.ts) to edit per page — this component, the sitemap,
// and the visible breadcrumb trail can never drift out of sync.
export default function PageHead({ path, showBreadcrumbs = true }: PageHeadProps) {
  const route = siteRoutes.find((r) => r.path === path);
  if (!route) {
    console.warn(`PageHead: no siteRoutes entry for path "${path}" — add one to client/data/siteRoutes.ts`);
    return null;
  }

  const breadcrumbItems =
    path === "/" ? [{ label: "Home", path: "/" }] : [{ label: "Home", path: "/" }, { label: route.label, path: route.path }];

  return (
    <>
      <SEO
        title={route.title}
        description={route.description}
        path={route.path}
        breadcrumbs={breadcrumbItems}
      />
      {showBreadcrumbs && path !== "/" && <Breadcrumbs items={breadcrumbItems} />}
    </>
  );
}
