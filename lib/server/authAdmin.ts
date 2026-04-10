import { createClient } from "@supabase/supabase-js";
import { assertSupabaseAuthAdminEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = assertSupabaseAuthAdminEnv();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function findAuthUserIdByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) throw error;

    const user = data.users.find((item) => item.email?.trim().toLowerCase() === normalizedEmail);
    if (user?.id) return user.id;
    if (data.users.length < 200) break;
    page += 1;
  }

  return null;
}
