import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type AdminPortalRole = "admin" | "sales_rep";

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getSalesRepEmails() {
  return (process.env.SALES_REP_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminPortalEmails() {
  return [...new Set([...getAdminEmails(), ...getSalesRepEmails()])];
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.trim().toLowerCase());
}

export function isSalesRepEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getSalesRepEmails().includes(email.trim().toLowerCase());
}

export function getAdminPortalRole(email: string | null | undefined): AdminPortalRole | null {
  if (isAdminEmail(email)) {
    return "admin";
  }

  if (isSalesRepEmail(email)) {
    return "sales_rep";
  }

  return null;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAdminPortalUser() {
  const user = await getCurrentUser();

  if (!user?.email) {
    redirect("/login");
  }

  const role = getAdminPortalRole(user.email);

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

  if (!isAdminEmail(user.email)) {
    redirect("/login");
  }

  return user;
}
