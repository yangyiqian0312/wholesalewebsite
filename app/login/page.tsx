import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "../../components/auth/login-form";
import { PageBreadcrumbs } from "../../components/shared/page-breadcrumbs";
import { SiteFooter } from "../../components/shared/site-footer";
import { SiteHeader } from "../../components/shared/site-header";
import { fetchAdminPortalRole } from "../../utils/admin-auth";
import { createClient } from "../../utils/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect((await fetchAdminPortalRole(user.email)) ? "/admin" : "/catalog");
  }

  return (
    <div className="page-shell login-page">
      <SiteHeader activePath="/catalog" />

      <main className="page-layout login-layout">
        <PageBreadcrumbs items={[{ href: "/", label: "Home" }, { label: "Login" }]} />
        <div className="login-stage">
          <section className="login-panel">
            <div className="login-split">
              <section className="login-side login-side-signin">
                <p className="eyebrow login-eyebrow">Customer Log In</p>
                <h1>Log in to your wholesale account</h1>
                <p className="login-copy">
                  Access your wholesale pricing, saved cart, and order history from one place.
                </p>
                <LoginForm redirectTo="/login" />
                <Link className="text-button login-back" href="/catalog">
                  Back to Catalog
                </Link>
              </section>

              <aside className="login-side login-side-cta">
                <p className="eyebrow login-eyebrow">Interested in Opening an Account?</p>
                <h2>Apply for wholesale access</h2>
                <p className="login-copy">
                  Submit your account application to unlock pricing, place orders, and work with your sales rep.
                </p>
                <Link className="primary-button login-cta-button" href="/open-account">
                  Open an Account
                </Link>
              </aside>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
