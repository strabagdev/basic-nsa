import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/requireAuthUser";
import { canCreatePlatforms, getPlatformBootstrap } from "@/lib/server/platforms";
import { createDataServerClient } from "@/lib/supabase/dataServer";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function GET(req: Request) {
  try {
    const { user } = await requireAuthUser(req);
    const bootstrap = await getPlatformBootstrap(user.id);
    const canCreate = !bootstrap.publicStatus.hasPlatforms || canCreatePlatforms(bootstrap.memberships);

    const manageablePlatformIds = bootstrap.memberships
      .filter((item) => item.role === "super_admin")
      .map((item) => item.platform_id);

    return NextResponse.json({
      can_create_platforms: canCreate,
      manageable_platforms: bootstrap.memberships.filter((item) =>
        manageablePlatformIds.includes(item.platform_id)
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar la gestión de plataformas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requireAuthUser(req);
    const bootstrap = await getPlatformBootstrap(user.id);
    const canCreate = !bootstrap.publicStatus.hasPlatforms || canCreatePlatforms(bootstrap.memberships);

    if (!canCreate) {
      return NextResponse.json({ error: "No tienes permisos para crear plataformas." }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      name?: unknown;
      slug?: unknown;
      description?: unknown;
    };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slugSource = typeof body.slug === "string" ? body.slug.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const slug = slugify(slugSource || name);

    if (!name || !slug) {
      return NextResponse.json({ error: "Nombre y slug válidos son requeridos." }, { status: 400 });
    }

    const db = createDataServerClient();
    const platformInsert = await db
      .from("platforms")
      .insert({
        name,
        slug,
        description: description || null,
        created_by: user.id,
      })
      .select("id, name, slug, description, logo_url")
      .single();
    if (platformInsert.error) throw platformInsert.error;

    const membershipInsert = await db
      .from("platform_memberships")
      .insert({
        platform_id: platformInsert.data.id,
        user_id: user.id,
        role: "super_admin",
        status: "active",
        invited_email: user.email?.trim().toLowerCase() ?? null,
      })
      .select("id")
      .single();
    if (membershipInsert.error) throw membershipInsert.error;

    await db
      .from("profiles")
      .update({
        active_platform_id: platformInsert.data.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({
      platform: {
        membership_id: membershipInsert.data.id,
        platform_id: platformInsert.data.id,
        platform_name: platformInsert.data.name,
        platform_slug: platformInsert.data.slug,
        platform_description: platformInsert.data.description
          ? String(platformInsert.data.description)
          : null,
        platform_logo_url: platformInsert.data.logo_url ? String(platformInsert.data.logo_url) : null,
        role: "super_admin",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la plataforma.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
