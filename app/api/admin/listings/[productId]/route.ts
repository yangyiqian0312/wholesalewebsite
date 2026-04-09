import { revalidatePath } from "next/cache";
import { getAdminApiToken, getBackendBaseUrl } from "../../../../../utils/backend-api";
import { requireAdminUser } from "../../../../../utils/admin-auth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  await requireAdminUser();

  const { productId } = await context.params;
  const payload = (await request.json()) as {
    name?: string;
    unitPrice?: number | null;
    releaseDate?: string | null;
    description?: string | null;
    isActive?: boolean;
  };

  const response = await fetch(`${getBackendBaseUrl()}/api/admin/catalog/products/${productId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": getAdminApiToken(),
    },
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  }

  if (typeof payload.name === "string" && payload.name.trim()) {
    const inflowResponse = await fetch(
      `${getBackendBaseUrl()}/api/admin/catalog/products/${productId}/sync-name-to-inflow`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": getAdminApiToken(),
        },
        cache: "no-store",
        body: JSON.stringify({
          name: payload.name.trim(),
        }),
      },
    );

    if (!inflowResponse.ok) {
      const inflowPayload = (await inflowResponse.json().catch(() => null)) as { error?: string } | null;
      return Response.json(
        {
          error:
            inflowPayload?.error ||
            "Local save succeeded, but syncing the name to Inflow failed.",
        },
        {
          status: 502,
        },
      );
    }
  }

  revalidatePath("/admin/listings");
  revalidatePath("/catalog");

  return Response.json(
    {
      success: true,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
