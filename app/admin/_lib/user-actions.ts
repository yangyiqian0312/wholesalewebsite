import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "../../../utils/admin-auth";
import { getAdminApiToken, getBackendBaseUrl } from "../../../utils/backend-api";
import { deleteAuthUserByEmail } from "../../../utils/supabase/admin";

function getRedirectMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const message = (error as { error?: unknown }).error;
  return typeof message === "string" ? message : null;
}

export async function deleteUserAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!applicationId || !email) {
    redirect("/admin/users?error=delete-missing-user");
  }

  try {
    await deleteAuthUserByEmail(email);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The login account could not be deleted.";
    redirect(`/admin/users/${applicationId}?error=delete-auth-failed&message=${encodeURIComponent(message)}`);
  }

  const response = await fetch(`${getBackendBaseUrl()}/api/admin/account-applications/${applicationId}`, {
    method: "DELETE",
    headers: {
      "x-admin-token": getAdminApiToken(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = getRedirectMessage(payload) ?? "The customer record could not be deleted.";
    redirect(`/admin/users/${applicationId}?error=delete-record-failed&message=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${applicationId}`);
  revalidatePath("/admin/orders");

  redirect("/admin/users?status=deleted");
}
