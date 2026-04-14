import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function PageBreadcrumbs({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          {index < items.length - 1 ? " / " : null}
        </span>
      ))}
    </nav>
  );
}
