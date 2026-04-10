import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "../../../../../utils/backend-api";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  if (!token.trim()) {
    return NextResponse.json(
      {
        error: "Invalid edit token",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");

    const response = await fetch(`${getBackendBaseUrl()}/api/account-applications/edit/${token}`, isMultipart
      ? {
          method: "PUT",
          body: await request.formData(),
          cache: "no-store",
        }
      : {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(await request.json()),
          cache: "no-store",
        });

    const payload = await response.json().catch(() => null);

    return NextResponse.json(payload ?? { ok: response.ok }, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to reach the application service.",
      },
      {
        status: 500,
      },
    );
  }
}
