function read(name: string) {
  return String(process.env[name] ?? "").trim();
}

export function getSupabaseUrl() {
  return (
    String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim() ||
    String(process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL ?? "").trim()
  );
}

export function getSupabaseAnonKey() {
  return (
    String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim() ||
    String(process.env.NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY ?? "").trim()
  );
}

export function getSupabaseDataUrl() {
  return read("SUPABASE_DATA_URL") || getSupabaseUrl();
}

export function getSupabaseDataServiceRoleKey() {
  return read("SUPABASE_DATA_SERVICE_ROLE_KEY") || read("SUPABASE_SERVICE_ROLE_KEY");
}

export function getSupabaseAuthAdminUrl() {
  return read("NEXT_PUBLIC_SUPABASE_AUTH_URL") || getSupabaseUrl();
}

export function getSupabaseAuthServiceRoleKey() {
  return read("SUPABASE_AUTH_SERVICE_ROLE_KEY") || read("SUPABASE_SERVICE_ROLE_KEY");
}

export function assertSupabasePublicEnv() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(getSupabasePublicEnvErrorMessage());
  }

  return { url, anonKey };
}

export function assertSupabaseDataServerEnv() {
  const url = getSupabaseDataUrl();
  const serviceRoleKey = getSupabaseDataServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error(getSupabaseDataServerEnvErrorMessage());
  }

  return { url, serviceRoleKey };
}

export function hasSupabasePublicEnv() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getSupabasePublicEnvErrorMessage() {
  return "Faltan NEXT_PUBLIC_SUPABASE_AUTH_URL y/o NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY para la capa pública de auth.";
}

export function assertSupabaseAuthAdminEnv() {
  const url = getSupabaseAuthAdminUrl();
  const serviceRoleKey = getSupabaseAuthServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error(getSupabaseAuthAdminEnvErrorMessage());
  }

  return { url, serviceRoleKey };
}

export function hasSupabaseDataServerEnv() {
  return Boolean(getSupabaseDataUrl() && getSupabaseDataServiceRoleKey());
}

export function getSupabaseDataServerEnvErrorMessage() {
  return "Faltan SUPABASE_DATA_URL y/o SUPABASE_DATA_SERVICE_ROLE_KEY para la capa de datos.";
}

export function hasSupabaseAuthAdminEnv() {
  return Boolean(getSupabaseAuthAdminUrl() && getSupabaseAuthServiceRoleKey());
}

export function getSupabaseAuthAdminEnvErrorMessage() {
  return "Faltan NEXT_PUBLIC_SUPABASE_AUTH_URL y/o SUPABASE_AUTH_SERVICE_ROLE_KEY para la capa central de auth.";
}

export function getPlatformSetupKey() {
  return read("PLATFORM_SETUP_KEY");
}
