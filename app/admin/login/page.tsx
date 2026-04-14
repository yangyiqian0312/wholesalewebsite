import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "../../../components/auth/login-form";
import { PageBreadcrumbs } from "../../../components/shared/page-breadcrumbs";
import { fetchAdminPortalRole, getCurrentUser } from "../../../utils/admin-auth";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;

  if (user?.email && (await fetchAdminPortalRole(user.email))) {
    redirect("/admin");
  }

  return (
    <div className="page-shell login-page">
      <main className="login-layout">
        <PageBreadcrumbs items={[{ href: "/", label: "Home" }, { label: "Admin Login" }]} />
        <section className="login-panel">
          <p className="eyebrow login-eyebrow">Admin Portal</p>
          <h1>Log in to review account applications</h1>
          <p className="login-copy">
            This admin portal is for allowlisted team accounts only. Once inside, you can approve
            incoming applications or deny them with a reason.
          </p>

          {error === "not-authorized" ? (
            <p className="login-error">This account is not authorized to access the admin portal.</p>
          ) : null}

          <LoginForm redirectTo="/admin" />

          <Link className="text-button login-back" href="/catalog">
            Back to Catalog
          </Link>
        </section>
      </main>
    </div>
  );
}
