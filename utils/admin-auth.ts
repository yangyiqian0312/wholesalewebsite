import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.trim().toLowerCase());
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/admin/login");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/admin/login?error=not-authorized");
  }

  return user;
}
