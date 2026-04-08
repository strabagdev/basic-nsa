function read(name: string) {
  return String(process.env[name] ?? "").trim();
}

export function getSupabaseUrl() {
  return read("NEXT_PUBLIC_SUPABASE_URL") || read("NEXT_PUBLIC_SUPABASE_AUTH_URL");
}

export function getSupabaseAnonKey() {
  return read("NEXT_PUBLIC_SUPABASE_ANON_KEY") || read("NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return read("SUPABASE_SERVICE_ROLE_KEY") || read("SUPABASE_DATA_SERVICE_ROLE_KEY");
}

export function assertSupabasePublicEnv() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(getSupabasePublicEnvErrorMessage());
  }

  return { url, anonKey };
}

export function assertSupabaseServiceEnv() {
  const url = getSupabaseUrl() || read("SUPABASE_DATA_URL");
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server configuration");
  }

  return { url, serviceRoleKey };
}

export function hasSupabasePublicEnv() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getSupabasePublicEnvErrorMessage() {
  return "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY en las variables públicas.";
}

export function getPlatformSetupKey() {
  return read("PLATFORM_SETUP_KEY");
}
