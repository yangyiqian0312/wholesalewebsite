import { revalidatePath } from "next/cache";
import { getAdminApiToken, getBackendBaseUrl } from "../../../../../utils/backend-api";
import { requireAdminUser } from "../../../../../utils/admin-auth";

type ListingUpdatePayload = {
  productId: string;
  name: string;
  unitPrice: number | null;
  releaseDate: string | null;
  description: string | null;
  isActive: boolean;
};

export async function PATCH(request: Request) {
  await requireAdminUser();

  const payload = (await request.json()) as {
    items?: ListingUpdatePayload[];
  };

  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!items.length) {
    return Response.json(
      { error: "Missing listing updates." },
      {
        status: 400,
      },
    );
  }

  for (const item of items) {
    const response = await fetch(`${getBackendBaseUrl()}/api/admin/catalog/products/${item.productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": getAdminApiToken(),
      },
      cache: "no-store",
      body: JSON.stringify({
        name: item.name,
        unitPrice: item.unitPrice,
        releaseDate: item.releaseDate,
        description: item.description,
        isActive: item.isActive,
      }),
    });

    if (!response.ok) {
      return new Response(await response.text(), {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("content-type") || "application/json",
        },
      });
    }
  }

  revalidatePath("/admin/listings");
  revalidatePath("/catalog");

  return Response.json(
    { success: true, updatedCount: items.length },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
