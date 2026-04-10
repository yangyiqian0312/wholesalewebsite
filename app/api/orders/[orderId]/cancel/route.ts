import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminApiToken, getBackendBaseUrl } from "../../../../../utils/backend-api";
import { createClient } from "../../../../../utils/supabase/server";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      {
        error: "You must be logged in to manage an order.",
      },
      {
        status: 401,
      },
    );
  }

  const { orderId } = await context.params;

  if (!orderId.trim()) {
    return NextResponse.json(
      {
        error: "Invalid order id",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const response = await fetch(`${getBackendBaseUrl()}/api/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": getAdminApiToken(),
      },
      body: JSON.stringify({
        email: user.email,
      }),
      cache: "no-store",
    });

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: responseBody?.error ?? "Failed to update order cancellation",
        },
        {
          status: response.status,
        },
      );
    }

    revalidatePath("/profile/orders");
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return NextResponse.json(responseBody ?? { ok: true });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to reach the order service.",
      },
      {
        status: 500,
      },
    );
  }
}
