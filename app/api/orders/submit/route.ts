import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminApiToken, getBackendBaseUrl } from "../../../../utils/backend-api";
import { createClient } from "../../../../utils/supabase/server";

type SubmitOrderItem = {
  productId: string;
  quantity: number;
  unitPrice: string;
  productName?: string;
  productCode?: string;
};

function isValidSubmitOrderItem(value: unknown): value is SubmitOrderItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.productId === "string" &&
    item.productId.trim().length > 0 &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0 &&
    typeof item.unitPrice === "string" &&
    item.unitPrice.trim().length > 0 &&
    (item.productName === undefined || typeof item.productName === "string") &&
    (item.productCode === undefined || typeof item.productCode === "string")
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      {
        error: "You must be logged in to submit an order.",
      },
      {
        status: 401,
      },
    );
  }

  const requestBody = (await request.json().catch(() => null)) as { items?: unknown } | null;
  const rawItems = Array.isArray(requestBody?.items) ? requestBody.items : [];
  const items = rawItems.filter(isValidSubmitOrderItem);

  if (!items.length || items.length !== rawItems.length) {
    return NextResponse.json(
      {
        error: "Invalid submit order payload",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const response = await fetch(`${getBackendBaseUrl()}/api/orders/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": getAdminApiToken(),
      },
      body: JSON.stringify({
        email: user.email,
        items,
      }),
      cache: "no-store",
    });

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: responseBody?.error ?? "Failed to submit order",
        },
        {
          status: response.status,
        },
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");

    if (responseBody?.localOrderId && typeof responseBody.localOrderId === "string") {
      revalidatePath(`/admin/orders/${responseBody.localOrderId}`);
    }

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
