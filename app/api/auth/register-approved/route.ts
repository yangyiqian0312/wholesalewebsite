import { createAdminClient } from "../../../../utils/supabase/admin";
import { getBackendBaseUrl } from "../../../../utils/backend-api";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    email?: string;
    password?: string;
    registrationToken?: string;
  };

  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password ?? "";
  const registrationToken = payload.registrationToken?.trim() ?? "";

  if (!email || !password || !registrationToken) {
    return Response.json(
      {
        error: "Missing registration payload.",
      },
      {
        status: 400,
      },
    );
  }

  if (password.length < 8) {
    return Response.json(
      {
        error: "Password must be at least 8 characters.",
      },
      {
        status: 400,
      },
    );
  }

  const supabase = createAdminClient();
  const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createUserError) {
    return Response.json(
      {
        error: createUserError.message,
      },
      {
        status: 400,
      },
    );
  }

  const completionResponse = await fetch(
    `${getBackendBaseUrl()}/api/account-applications/register/${registrationToken}/complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    },
  );

  if (!completionResponse.ok) {
    await supabase.auth.admin.deleteUser(createdUser.user.id).catch(() => undefined);

    let message = "Account registration could not be completed.";

    try {
      const completionPayload = (await completionResponse.json()) as { error?: string };
      message = completionPayload.error ?? message;
    } catch {
    }

    return Response.json(
      {
        error: message,
      },
      {
        status: completionResponse.status,
      },
    );
  }

  return Response.json({
    success: true,
  });
}
