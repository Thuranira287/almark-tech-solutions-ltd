import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { siteRoutes } from "@/data/siteRoutes";

interface PageHeadProps {
  path: string; 
  showBreadcrumbs?: boolean; 
}

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
