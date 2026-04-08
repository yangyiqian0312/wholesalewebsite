import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminApiToken, getBackendBaseUrl } from "../../../../utils/backend-api";
import { createClient } from "../../../../utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      {
        error: "You must be logged in to view your profile.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const response = await fetch(
      `${getBackendBaseUrl()}/api/admin/account-applications/profile?email=${encodeURIComponent(user.email)}`,
      {
        headers: {
          "x-admin-token": getAdminApiToken(),
        },
        cache: "no-store",
      },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: payload?.error ?? "Failed to load profile",
        },
        {
          status: response.status,
        },
      );
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to reach the profile service.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      {
        error: "You must be logged in to update your profile.",
      },
      {
        status: 401,
      },
    );
  }

  const formData = await request.formData().catch(() => null);
  const payloadText = formData?.get("payload");

  if (typeof payloadText !== "string") {
    return NextResponse.json(
      {
        error: "Invalid account profile payload",
      },
      {
        status: 400,
      },
    );
  }

  const body = (() => {
    try {
      return JSON.parse(payloadText) as { profile?: unknown };
    } catch {
      return null;
    }
  })();

  if (!body?.profile || typeof body.profile !== "object" || Array.isArray(body.profile)) {
    return NextResponse.json(
      {
        error: "Invalid account profile payload",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const backendFormData = new FormData();
    backendFormData.append(
      "payload",
      JSON.stringify({
        email: user.email,
        profile: body.profile,
      }),
    );

    for (const entry of formData?.getAll("documents") ?? []) {
      if (entry instanceof File && entry.size > 0) {
        backendFormData.append("documents", entry);
      }
    }

    const response = await fetch(`${getBackendBaseUrl()}/api/admin/account-applications/profile`, {
      method: "PATCH",
      headers: {
        "x-admin-token": getAdminApiToken(),
      },
      body: backendFormData,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: payload?.error ?? "Failed to update profile",
          details: payload?.details,
        },
        {
          status: response.status,
        },
      );
    }

    revalidatePath("/profile");
    revalidatePath("/admin");
    revalidatePath("/admin/applications");
    revalidatePath("/admin/users");

    if (payload?.id && typeof payload.id === "string") {
      revalidatePath(`/admin/users/${payload.id}`);
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to reach the profile service.",
      },
      {
        status: 500,
      },
    );
  }
}
