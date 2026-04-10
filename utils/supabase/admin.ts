import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin client is not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function deleteAuthUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required to delete an auth user.");
  }

  const supabase = createAdminClient();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message);
    }

    const users = data.users ?? [];
    const matchedUser = users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (matchedUser) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(matchedUser.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return true;
    }

    if (users.length < perPage) {
      return false;
    }

    page += 1;
  }
}
