import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "../../components/auth/register-form";
import { PageBreadcrumbs } from "../../components/shared/page-breadcrumbs";
import { SiteFooter } from "../../components/shared/site-footer";
import { SiteHeader } from "../../components/shared/site-header";
import { getBackendBaseUrl } from "../../utils/backend-api";

type RegistrationInvite = {
  contactName: string;
  businessName: string;
  email: string;
};

async function fetchRegistrationInvite(token: string) {
  const response = await fetch(
    `${getBackendBaseUrl()}/api/account-applications/register/${token}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404 || response.status === 400) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch registration invite: ${response.status}`);
  }

  return (await response.json()) as RegistrationInvite;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const token = Array.isArray(resolvedSearchParams.token)
    ? resolvedSearchParams.token[0]
    : resolvedSearchParams.token;
  const status = Array.isArray(resolvedSearchParams.status)
    ? resolvedSearchParams.status[0]
    : resolvedSearchParams.status;

  if (!token && !status) {
    redirect("/login");
  }

  const invite = token ? await fetchRegistrationInvite(token) : null;

  if (token && !invite && !status) {
    redirect("/register?status=invalid-link");
  }

  return (
    <div className="page-shell login-page">
      <SiteHeader activePath="/catalog" />
      <main className="page-layout login-layout">
        <PageBreadcrumbs items={[{ href: "/", label: "Home" }, { href: "/login", label: "Login" }, { label: "Register" }]} />

        <div className="login-stage">
          <section className="login-panel">
            <div className="login-split">
              <div className="login-side login-side-signin">
                <p className="eyebrow login-eyebrow">Approved Account Setup</p>
                <h1>Create your wholesale account</h1>
                <p className="login-copy">
                  Only the approved application email can be used to create this account.
                </p>

                {status === "invalid-link" ? (
                  <p className="login-error">
                    This registration link is invalid or has already been used.
                  </p>
                ) : null}

                {invite && token ? (
                  <>
                    <p className="login-copy">
                      {invite.contactName} | {invite.businessName}
                    </p>
                    <RegisterForm
                      approvedEmail={invite.email}
                      registrationToken={token}
                    />
                  </>
                ) : null}

                <Link className="text-button login-back" href="/login">
                  Back to Login
                </Link>
              </div>

              <div className="login-side login-side-cta">
                <p className="eyebrow login-eyebrow">Already approved?</p>
                <h2>Sign in after your account is created</h2>
                <p className="login-copy">
                  Once registration is complete, you can log in to view pricing, place orders, and track order history.
                </p>

                <Link className="primary-button login-cta-button" href="/login">
                  Go to Login
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
