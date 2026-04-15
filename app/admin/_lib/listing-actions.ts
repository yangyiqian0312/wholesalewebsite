import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminApiToken, getBackendBaseUrl } from "../../../utils/backend-api";
import { requireAdminPortalUser } from "../../../utils/admin-auth";

function buildListingsPath({
  smart,
  statusFilter,
  page,
  pageSize,
}: {
  smart?: string;
  statusFilter?: string;
  page?: string;
  pageSize?: string;
}) {
  const query = new URLSearchParams();

  if (smart?.trim()) {
    query.set("smart", smart.trim());
  }

  if (statusFilter?.trim()) {
    query.set("statusFilter", statusFilter.trim());
  }

  if (page?.trim() && page.trim() !== "1") {
    query.set("page", page.trim());
  }

  if (pageSize?.trim() && pageSize.trim() !== "20") {
    query.set("pageSize", pageSize.trim());
  }

  const queryString = query.toString();
  return queryString ? `/admin/listings?${queryString}` : "/admin/listings";
}

function parseListingPayload(formData: FormData, productId: string) {
  const normalizedProductId = productId.trim();

  return {
    productId: normalizedProductId,
    body: {
      name: String(formData.get(`name:${normalizedProductId}`) ?? "").trim(),
      unitPrice: (() => {
        const value = String(formData.get(`unitPrice:${normalizedProductId}`) ?? "").trim();
        return value ? Number(value) : null;
      })(),
      releaseDate: (() => {
        const value = String(formData.get(`releaseDate:${normalizedProductId}`) ?? "").trim();
        return value || null;
      })(),
      description: (() => {
        const value = String(formData.get(`description:${normalizedProductId}`) ?? "").trim();
        return value || null;
      })(),
      isActive: formData.get(`isActive:${normalizedProductId}`) === "on",
    },
  };
}

export async function updateListingAction(formData: FormData) {
  "use server";

  await requireAdminPortalUser();

  const smart = String(formData.get("smart") ?? "").trim();
  const statusFilter = String(formData.get("statusFilter") ?? "").trim();
  const page = String(formData.get("page") ?? "").trim();
  const pageSize = String(formData.get("pageSize") ?? "").trim();
  const listingsPath = buildListingsPath({ smart, statusFilter, page, pageSize });
  const intent = String(formData.get("intent") ?? "bulk").trim();

  const singleProductId = intent.startsWith("single:") ? intent.slice("single:".length).trim() : "";
  const productIds = singleProductId
    ? [singleProductId]
    : formData
        .getAll("productIds")
        .map((value) => String(value).trim())
        .filter(Boolean);

  if (!productIds.length) {
    redirect(`${listingsPath}${listingsPath.includes("?") ? "&" : "?"}error=missing-product`);
  }

  for (const productId of productIds) {
    const payload = parseListingPayload(formData, productId);

    const response = await fetch(`${getBackendBaseUrl()}/api/admin/catalog/products/${payload.productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": getAdminApiToken(),
      },
      cache: "no-store",
      body: JSON.stringify(payload.body),
    });

    if (!response.ok) {
      redirect(`${listingsPath}${listingsPath.includes("?") ? "&" : "?"}error=update-failed`);
    }
  }

  revalidatePath("/admin/listings");
  revalidatePath("/catalog");
  revalidateTag("catalog-products");
  revalidateTag("catalog-filter-options");
  redirect(`${listingsPath}${listingsPath.includes("?") ? "&" : "?"}status=updated`);
}
