import { revalidatePath } from "next/cache";
import { getAdminApiToken, getBackendBaseUrl } from "../../../../../utils/backend-api";
import { requireAdminPortalUser } from "../../../../../utils/admin-auth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  await requireAdminPortalUser();

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

  if ((typeof payload.name === "string" && payload.name.trim()) || payload.releaseDate !== undefined) {
    const inflowResponse = await fetch(
      `${getBackendBaseUrl()}/api/admin/catalog/products/${productId}/sync-editable-fields-to-inflow`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": getAdminApiToken(),
        },
        cache: "no-store",
        body: JSON.stringify({
          ...(typeof payload.name === "string" && payload.name.trim() ? { name: payload.name.trim() } : {}),
          ...(payload.releaseDate !== undefined ? { releaseDate: payload.releaseDate } : {}),
        }),
      },
    );

    if (!inflowResponse.ok) {
      const inflowPayload = (await inflowResponse.json().catch(() => null)) as { error?: string; code?: string } | null;
      return Response.json(
        {
          error:
            inflowPayload?.code === "INFLOW_RATE_LIMIT"
              ? "Saved locally, but the system is busy. Please try syncing again later."
              : inflowPayload?.error ||
                "Local save succeeded, but syncing the name to Inflow failed.",
          code: inflowPayload?.code,
        },
        {
          status: inflowPayload?.code === "INFLOW_RATE_LIMIT" ? 503 : 502,
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
