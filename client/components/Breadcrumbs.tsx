import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { BreadcrumbItem } from "@/components/SEO";

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <ol className="flex items-center flex-wrap gap-1 text-sm text-gray-500">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1">
              {i === 0 ? (
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-gray-300" aria-hidden="true" />
              )}
              {isLast ? (
                <span className="font-medium text-brand-dark" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.path} className="hover:text-brand-gold-dark hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
