import { createClient } from "@supabase/supabase-js";
import { assertSupabasePublicEnv } from "@/lib/env";

type SupabaseAuthClient = ReturnType<typeof createClient>;

let cachedClient: SupabaseAuthClient | null = null;

function getSupabaseAuthClient(): SupabaseAuthClient {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = assertSupabasePublicEnv();
  cachedClient = createClient(url, anonKey);
  return cachedClient;
}

export const supabaseAuth = new Proxy({} as SupabaseAuthClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseAuthClient(), prop, receiver);
  },
});
