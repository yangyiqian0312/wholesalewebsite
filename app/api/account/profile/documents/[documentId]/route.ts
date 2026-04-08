import { getAdminApiToken, getBackendBaseUrl } from "../../../../../../utils/backend-api";
import { createClient } from "../../../../../../utils/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const { documentId } = await context.params;

  const profileResponse = await fetch(
    `${getBackendBaseUrl()}/api/admin/account-applications/profile?email=${encodeURIComponent(user.email)}`,
    {
      headers: {
        "x-admin-token": getAdminApiToken(),
      },
      cache: "no-store",
    },
  );

  if (!profileResponse.ok) {
    return new Response("Profile not found.", {
      status: profileResponse.status || 404,
    });
  }

  const profile = (await profileResponse.json()) as {
    documents?: Array<{ id: string }>;
  };

  if (!profile.documents?.some((document) => document.id === documentId)) {
    return new Response("Document not found.", {
      status: 404,
    });
  }

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
