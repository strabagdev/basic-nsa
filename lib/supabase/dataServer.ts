import { createClient } from "@supabase/supabase-js";
import { assertSupabaseDataServerEnv } from "@/lib/env";

export function createDataServerClient() {
  const { url, serviceRoleKey } = assertSupabaseDataServerEnv();

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
