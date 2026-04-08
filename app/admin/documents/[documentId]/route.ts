import { getAdminApiToken, getBackendBaseUrl } from "../../../../utils/backend-api";
import { requireAdminUser } from "../../../../utils/admin-auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  await requireAdminUser();

  const { documentId } = await context.params;

  const response = await fetch(
    `${getBackendBaseUrl()}/api/admin/account-application-documents/${documentId}/download`,
    {
      headers: {
        "x-admin-token": getAdminApiToken(),
      },
      cache: "no-store",
    },
  );

  if (!response.ok || !response.body) {
    return new Response("Document download failed.", {
      status: response.status || 500,
    });
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition":
        response.headers.get("content-disposition") || 'attachment; filename="document"',
      "Cache-Control": "no-store",
    },
  });
}
