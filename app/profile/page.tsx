import { redirect } from "next/navigation";
import { ProfileForm, type AccountProfile } from "../../components/account/profile-form";
import { PageBreadcrumbs } from "../../components/shared/page-breadcrumbs";
import { SiteFooter } from "../../components/shared/site-footer";
import { SiteHeader } from "../../components/shared/site-header";
import { createClient } from "../../utils/supabase/server";
import { getAdminApiToken, getBackendBaseUrl } from "../../utils/backend-api";

async function fetchProfile(email: string): Promise<AccountProfile | null> {
  const response = await fetch(
    `${getBackendBaseUrl()}/api/admin/account-applications/profile?email=${encodeURIComponent(email)}`,
    {
      headers: {
        "x-admin-token": getAdminApiToken(),
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load account profile: ${response.status}`);
  }

  return (await response.json()) as AccountProfile;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const profile = await fetchProfile(user.email);

  if (!profile) {
    redirect("/catalog");
  }

  return (
    <div className="page-shell">
      <SiteHeader activePath="/catalog" />

      <main className="page-layout">
        <PageBreadcrumbs items={[{ href: "/", label: "Home" }, { label: "Profile" }]} />
        <ProfileForm profile={profile} />
      </main>

      <SiteFooter />
    </div>
  );
}
