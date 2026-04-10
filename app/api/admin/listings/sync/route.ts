import { revalidatePath } from "next/cache";
import { getBackendBaseUrl } from "../../../../../utils/backend-api";
import { requireAdminUser } from "../../../../../utils/admin-auth";

export async function POST() {
  await requireAdminUser();

  const response = await fetch(`${getBackendBaseUrl()}/api/sync/inflow/products`, {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    return Response.json(
      {
        error: payload?.error || "Failed to sync products into the local database.",
      },
      {
        status: response.status,
      },
    );
  }

  revalidatePath("/admin/listings");
  revalidatePath("/catalog");

  return Response.json(await response.json(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
