import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminApiToken, getBackendBaseUrl } from "../../../utils/backend-api";
import { getFrontendBaseUrl } from "../../../utils/backend-api";
import { requireAdminUser } from "../../../utils/admin-auth";

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const error = (payload as { error?: unknown }).error;
  return typeof error === "string" ? error : null;
}

export async function approveApplicationAction(formData: FormData) {
  "use server";

  const user = await requireAdminUser();
  const applicationId = String(formData.get("applicationId") ?? "").trim();

  if (!applicationId) {
    redirect("/admin/applications?error=missing-application");
  }

  const response = await fetch(
    `${getBackendBaseUrl()}/api/admin/account-applications/${applicationId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": getAdminApiToken(),
      },
      cache: "no-store",
      body: JSON.stringify({
        status: "APPROVED",
        reviewedByEmail: user.email,
        frontendBaseUrl: getFrontendBaseUrl(),
      }),
    },
  );

  const payload = response.ok ? await response.json() : null;
  const emailNotification = payload?.emailNotification;

  if (!response.ok) {
    redirect("/admin/applications?error=approve-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/users");

  if (emailNotification && !emailNotification.sent) {
    const message = emailNotification.error ?? "Approval email could not be sent.";
    redirect(`/admin/applications?error=email-failed&message=${encodeURIComponent(message)}`);
  }

  redirect("/admin/applications?status=approved");
}

export async function denyApplicationAction(formData: FormData) {
  "use server";

  const user = await requireAdminUser();
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const deniedReason = String(formData.get("deniedReason") ?? "").trim();

  if (!applicationId) {
    redirect("/admin/applications?error=missing-application");
  }

  if (!deniedReason) {
    redirect("/admin/applications?error=missing-deny-reason");
  }

  const response = await fetch(
    `${getBackendBaseUrl()}/api/admin/account-applications/${applicationId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": getAdminApiToken(),
      },
      cache: "no-store",
      body: JSON.stringify({
        status: "DENIED",
        reviewedByEmail: user.email,
        deniedReason,
        frontendBaseUrl: getFrontendBaseUrl(),
      }),
    },
  );

  const payload = response.ok ? await response.json() : null;
  const emailNotification = payload?.emailNotification;

  if (!response.ok) {
    const message = getErrorMessage(await response.json().catch(() => null));
    const suffix = message ? `&message=${encodeURIComponent(message)}` : "";
    redirect(`/admin/applications?error=deny-failed${suffix}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/users");

  if (emailNotification && !emailNotification.sent) {
    const message = emailNotification.error ?? "Email notification could not be sent.";
    redirect(`/admin/applications?error=email-failed&message=${encodeURIComponent(message)}`);
  }

  redirect("/admin/applications?status=denied");
}
