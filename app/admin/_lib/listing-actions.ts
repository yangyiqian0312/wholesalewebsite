import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminApiToken, getBackendBaseUrl } from "../../../utils/backend-api";
import { requireAdminUser } from "../../../utils/admin-auth";

export async function updateListingAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const productId = String(formData.get("productId") ?? "").trim();
  const smart = String(formData.get("smart") ?? "").trim();
  const listingsPath = smart ? `/admin/listings?smart=${encodeURIComponent(smart)}` : "/admin/listings";

  if (!productId) {
    redirect(smart ? `${listingsPath}&error=missing-product` : "/admin/listings?error=missing-product");
  }

  const unitPriceValue = String(formData.get("unitPrice") ?? "").trim();
  const releaseDateValue = String(formData.get("releaseDate") ?? "").trim();

  const response = await fetch(`${getBackendBaseUrl()}/api/admin/catalog/products/${productId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": getAdminApiToken(),
    },
    cache: "no-store",
    body: JSON.stringify({
      name: String(formData.get("name") ?? "").trim(),
      unitPrice: unitPriceValue ? Number(unitPriceValue) : null,
      releaseDate: releaseDateValue || null,
      isActive: String(formData.get("isActive") ?? "").trim() === "on",
    }),
  });

  if (!response.ok) {
    redirect(smart ? `${listingsPath}&error=update-failed` : "/admin/listings?error=update-failed");
  }

  revalidatePath("/admin/listings");
  revalidatePath("/catalog");
  redirect(smart ? `${listingsPath}&status=updated` : "/admin/listings?status=updated");
}
