import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "../../components/auth/login-form";
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
      <main className="login-layout">
        <section className="login-panel">
          <p className="eyebrow login-eyebrow">Account Access</p>
          <h1>Log in to your wholesale account</h1>
          <p className="login-copy">
            Use your approved account credentials to access pricing, quantity input, and ordering
            workflows.
          </p>

          <LoginForm redirectTo="/login" />

          <Link className="text-button login-back" href="/catalog">
            Back to Catalog
          </Link>
        </section>
      </main>
    </div>
  );
}
