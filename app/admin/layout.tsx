import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdminUser } from "../../utils/admin-auth";

const adminNavItems = [
  {
    href: "/admin/applications",
    label: "Applications",
    description: "Approve or deny incoming account requests",
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "View customer contacts and approval status",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    description: "View submitted wholesale order details",
  },
  {
    href: "/admin/listings",
    label: "Listings",
    description: "Review and edit local catalog listings",
  },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdminUser();

  const sidebarContent = (
    <>
      <div className="admin-sidebar-head">
        <p className="admin-sidebar-kicker">Admin Portal</p>
        <h1>Wholesale Ops</h1>
        <span>{user.email}</span>
      </div>

      <nav aria-label="Admin Sections" className="admin-sidebar-nav">
        {adminNavItems.map((item) => (
          <Link className="admin-nav-link" href={item.href} key={item.href}>
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-links">
        <Link className="text-button" href="/open-account">
          View application form
        </Link>
        <Link className="text-button" href="/catalog">
          Back to catalog
        </Link>
      </div>
    </>
  );

  return (
    <div className="page-shell">
      <main className="page-layout admin-shell">
        <aside className="panel admin-sidebar admin-sidebar-desktop">{sidebarContent}</aside>

        <details className="panel admin-sidebar admin-sidebar-mobile">
          <summary className="admin-sidebar-summary">
            <div className="admin-sidebar-summary-copy">
              <p className="admin-sidebar-kicker">Admin Portal</p>
              <strong>Wholesale Ops</strong>
              <span className="admin-sidebar-summary-email">{user.email}</span>
            </div>
            <span className="admin-sidebar-summary-icon" aria-hidden="true">
              <svg viewBox="0 0 16 16">
                <path
                  d="M3.5 6 8 10.5 12.5 6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </span>
          </summary>
          {sidebarContent}
        </details>

        <section className="admin-main">{children}</section>
      </main>
    </div>
  );
}
