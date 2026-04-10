import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "../../../utils/backend-api";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");

    const response = await fetch(`${getBackendBaseUrl()}/api/account-applications`, isMultipart
      ? {
          method: "POST",
          body: await request.formData(),
          cache: "no-store",
        }
      : {
          method: "POST",
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
