import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPortalUser } from "../../../utils/admin-auth";
import { getAdminApiToken, getBackendBaseUrl, getFrontendBaseUrl } from "../../../utils/backend-api";

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const message = (payload as { error?: unknown }).error;
  return typeof message === "string" ? message : null;
}

export async function approveOrderAction(formData: FormData) {
  "use server";

  const user = await requireAdminPortalUser();
  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!orderId) {
    redirect("/admin/orders?error=missing-order");
  }

  const lineIds = formData
    .getAll("lineId")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!lineIds.length) {
    redirect(`/admin/orders/${orderId}?error=missing-lines`);
  }

  const lines = lineIds.map((lineId) => ({
    id: lineId,
    quantity: Number(String(formData.get(`quantity:${lineId}`) ?? "1").trim()),
    unitPrice: String(formData.get(`unitPrice:${lineId}`) ?? "").trim(),
  }));

  const adjustmentIds = formData
    .getAll("adjustmentId")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const adjustments = adjustmentIds
    .map((adjustmentId) => ({
      label: String(formData.get(`adjustmentLabel:${adjustmentId}`) ?? "").trim(),
      amount: String(formData.get(`adjustmentAmount:${adjustmentId}`) ?? "").trim(),
    }))
    .filter((adjustment) => adjustment.label && adjustment.amount);

  const salesRepNote = String(formData.get("salesRepNote") ?? "").trim();

  const response = await fetch(`${getBackendBaseUrl()}/api/admin/orders/${orderId}/approve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": getAdminApiToken(),
    },
    cache: "no-store",
    body: JSON.stringify({
      reviewedByEmail: user.email,
      frontendBaseUrl: getFrontendBaseUrl(),
      salesRepNote,
      lines,
      adjustments,
    }),
  });

  const payload = response.ok ? await response.json().catch(() => null) : await response.json().catch(() => null);

  if (!response.ok) {
    const message = getErrorMessage(payload);
    const suffix = message ? `&message=${encodeURIComponent(message)}` : "";
    redirect(`/admin/orders/${orderId}?error=approve-failed${suffix}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/profile/orders");

  const emailNotification = payload && typeof payload === "object" ? (payload as { emailNotification?: { sent?: boolean; error?: string; reason?: string } }).emailNotification : null;

  if (emailNotification && !emailNotification.sent) {
    const message = emailNotification.error ?? emailNotification.reason ?? "Approved order email could not be sent.";
    redirect(`/admin/orders/${orderId}?status=approved&message=${encodeURIComponent(message)}`);
  }

  redirect(`/admin/orders/${orderId}?status=approved`);
}
