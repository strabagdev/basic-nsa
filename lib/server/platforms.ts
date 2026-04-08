import { createDataServerClient } from "@/lib/supabase/dataServer";

export type PlatformRole = "super_admin" | "platform_admin" | "platform_user";

export type PlatformMembershipSummary = {
  membership_id: string;
  platform_id: string;
  platform_name: string;
  platform_slug: string;
  platform_description: string | null;
  platform_logo_url: string | null;
  role: PlatformRole;
};

function extractMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return String(error ?? "Unknown error");
}

export async function getPublicPlatformStatus() {
  const db = createDataServerClient();
  const [settingsResult, platformCountResult] = await Promise.all([
    db
      .from("platform_settings")
      .select("platform_name, support_email, auth_provider")
      .eq("id", true)
      .maybeSingle(),
    db.from("platforms").select("id", { count: "exact", head: true }),
  ]);

  if (settingsResult.error) throw settingsResult.error;
  if (platformCountResult.error) throw platformCountResult.error;

  return {
    hasPlatforms: (platformCountResult.count ?? 0) > 0,
    platformName: settingsResult.data?.platform_name ?? null,
    supportEmail: settingsResult.data?.support_email ?? null,
    authProvider: settingsResult.data?.auth_provider ?? "supabase",
  };
}

export async function listUserPlatformMemberships(userId: string) {
  const db = createDataServerClient();
  const { data, error } = await db
    .from("platform_memberships")
    .select(
      "id, role, platform:platforms(id, name, slug, description, logo_url, is_active)"
    )
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) throw error;

  return ((data ?? []) as Array<{
    id: string;
    role: PlatformRole;
    platform:
      | {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          is_active: boolean;
        }
      | Array<{
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          is_active: boolean;
        }>
      | null;
  }>)
    .map((row) => {
      const platform = Array.isArray(row.platform) ? row.platform[0] : row.platform;
      if (!platform || !platform.is_active) return null;
      return {
        membership_id: String(row.id),
        platform_id: String(platform.id),
        platform_name: String(platform.name),
        platform_slug: String(platform.slug),
        platform_description: platform.description ? String(platform.description) : null,
        platform_logo_url: platform.logo_url ? String(platform.logo_url) : null,
        role: row.role,
      } satisfies PlatformMembershipSummary;
    })
    .filter((value): value is PlatformMembershipSummary => Boolean(value));
}

export async function getPlatformBootstrap(userId: string) {
  const db = createDataServerClient();

  const [profileResult, settingsResult, memberships, publicStatus] = await Promise.all([
    db
      .from("profiles")
      .select("id, email, full_name, avatar_url, last_seen_at, active_platform_id")
      .eq("id", userId)
      .single(),
    db
      .from("platform_settings")
      .select("platform_name, support_email, auth_provider")
      .eq("id", true)
      .maybeSingle(),
    listUserPlatformMemberships(userId),
    getPublicPlatformStatus(),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (settingsResult.error) throw settingsResult.error;

  const activePlatformId = profileResult.data.active_platform_id
    ? String(profileResult.data.active_platform_id)
    : null;
  const activeMembership =
    memberships.find((membership) => membership.platform_id === activePlatformId) ?? memberships[0] ?? null;

  return {
    profile: {
      id: String(profileResult.data.id),
      email: String(profileResult.data.email),
      full_name: profileResult.data.full_name ? String(profileResult.data.full_name) : null,
      avatar_url: profileResult.data.avatar_url ? String(profileResult.data.avatar_url) : null,
      last_seen_at: profileResult.data.last_seen_at ? String(profileResult.data.last_seen_at) : null,
      active_platform_id: activeMembership?.platform_id ?? null,
    },
    settings: {
      platform_name: settingsResult.data?.platform_name ? String(settingsResult.data.platform_name) : null,
      support_email: settingsResult.data?.support_email ? String(settingsResult.data.support_email) : null,
      auth_provider: settingsResult.data?.auth_provider ? String(settingsResult.data.auth_provider) : "supabase",
    },
    memberships,
    activeMembership,
    publicStatus,
  };
}

export async function setActivePlatform(userId: string, platformId: string) {
  const memberships = await listUserPlatformMemberships(userId);
  const membership = memberships.find((item) => item.platform_id === platformId);
  if (!membership) {
    throw new Error("No tienes acceso a esa plataforma.");
  }

  const db = createDataServerClient();
  const { error } = await db
    .from("profiles")
    .update({ active_platform_id: platformId, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;

  return membership;
}

export async function requirePlatformMembership(userId: string, platformId: string) {
  const memberships = await listUserPlatformMemberships(userId);
  const membership = memberships.find((item) => item.platform_id === platformId);
  if (!membership) throw new Error("No tienes acceso a la plataforma activa.");
  return membership;
}

export function canManagePlatform(role: PlatformRole) {
  return role === "super_admin" || role === "platform_admin";
}

export function canCreatePlatforms(memberships: PlatformMembershipSummary[]) {
  return memberships.some((membership) => membership.role === "super_admin");
}

export async function getCurrentActiveMembership(userId: string) {
  const bootstrap = await getPlatformBootstrap(userId);
  return bootstrap.activeMembership;
}

export function toApiError(error: unknown, fallback: string) {
  return { error: extractMessage(error) || fallback };
}
