import { createClient } from "@supabase/supabase-js";
import { assertSupabaseServiceEnv } from "@/lib/env";

export function createDataServerClient() {
  const { url, serviceRoleKey } = assertSupabaseServiceEnv();

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
