import { redirect } from "next/navigation";
import { getAdminApiToken, getBackendBaseUrl } from "./backend-api";
import { createClient } from "./supabase/server";

export type AdminPortalRole = "admin" | "sales_rep";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function fetchAdminPortalRole(email: string | null | undefined): Promise<AdminPortalRole | null> {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const query = new URLSearchParams({
    email: normalizedEmail,
  });
  const response = await fetch(
    `${getBackendBaseUrl()}/api/admin/portal-users/resolve?${query.toString()}`,
    {
      headers: {
        "x-admin-token": getAdminApiToken(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to resolve admin portal role: ${response.status}`);
  }

  const payload = (await response.json()) as {
    role?: AdminPortalRole | null;
  };

  return payload.role ?? null;
}

export async function fetchSalesRepEmails() {
  const query = new URLSearchParams({
    role: "sales_rep",
  });
  const response = await fetch(
    `${getBackendBaseUrl()}/api/admin/portal-users?${query.toString()}`,
    {
      headers: {
        "x-admin-token": getAdminApiToken(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch sales reps: ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    email: string;
  }>;

  return payload.map((item) => item.email.trim().toLowerCase());
}

export async function requireAdminPortalUser() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/login");
  }

  const role = await fetchAdminPortalRole(user.email);

  if (!role) {
    redirect("/login");
  }

  return {
    ...user,
    role,
  };
}

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/login");
  }

  if ((await fetchAdminPortalRole(user.email)) !== "admin") {
    redirect("/login");
  }

  return user;
}
