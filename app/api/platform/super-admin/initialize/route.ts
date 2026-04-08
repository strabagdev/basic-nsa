import { NextResponse } from "next/server";
import { getPlatformSetupKey } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/server/authAdmin";
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

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: unknown;
      password?: unknown;
      setupKey?: unknown;
      platformName?: unknown;
      platformSlug?: unknown;
    };

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const setupKey = typeof body.setupKey === "string" ? body.setupKey.trim() : "";
    const platformName = typeof body.platformName === "string" ? body.platformName.trim() : "";
    const platformSlugSource = typeof body.platformSlug === "string" ? body.platformSlug.trim() : "";
    const platformSlug = slugify(platformSlugSource || platformName);

    if (!email || !password || password.length < 8 || !platformName || !platformSlug) {
      return NextResponse.json({ error: "Completa email, contraseña y nombre de plataforma." }, { status: 400 });
    }

    const expectedSetupKey = getPlatformSetupKey();
    if (!expectedSetupKey) {
      return NextResponse.json({ error: "Falta PLATFORM_SETUP_KEY en el servidor." }, { status: 500 });
    }
    if (setupKey !== expectedSetupKey) {
      return NextResponse.json({ error: "Clave de setup inválida." }, { status: 403 });
    }

    const db = createDataServerClient();
    const existingPlatforms = await db.from("platforms").select("id", { count: "exact", head: true });
    if (existingPlatforms.error) throw existingPlatforms.error;
    if ((existingPlatforms.count ?? 0) > 0) {
      return NextResponse.json({ error: "La plataforma ya fue inicializada." }, { status: 409 });
    }

    const admin = createSupabaseAdminClient();
    const createUserResult = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Platform Super Admin" },
    });

    if (createUserResult.error || !createUserResult.data.user?.id) {
      return NextResponse.json(
        { error: createUserResult.error?.message || "No se pudo crear el super admin inicial." },
        { status: 400 }
      );
    }

    const userId = createUserResult.data.user.id;
    const now = new Date().toISOString();

    const profileUpsert = await db.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: "Platform Super Admin",
        last_seen_at: now,
      },
      { onConflict: "id" }
    );
    if (profileUpsert.error) throw profileUpsert.error;

    const platformInsert = await db
      .from("platforms")
      .insert({
        name: platformName,
        slug: platformSlug,
        created_by: userId,
      })
      .select("id, name, slug")
      .single();
    if (platformInsert.error) throw platformInsert.error;

    const membershipInsert = await db.from("platform_memberships").insert({
      platform_id: platformInsert.data.id,
      user_id: userId,
      role: "super_admin",
      status: "active",
      invited_email: email,
    });
    if (membershipInsert.error) throw membershipInsert.error;

    const updateProfile = await db
      .from("profiles")
      .update({
        active_platform_id: platformInsert.data.id,
        updated_at: now,
      })
      .eq("id", userId);
    if (updateProfile.error) throw updateProfile.error;

    const settingsUpsert = await db.from("platform_settings").upsert(
      {
        id: true,
        platform_name: platformName,
        auth_provider: "supabase",
        initialized_at: now,
        initialized_by: userId,
      },
      { onConflict: "id" }
    );
    if (settingsUpsert.error) throw settingsUpsert.error;

    return NextResponse.json({
      email,
      platform: {
        id: platformInsert.data.id,
        name: platformInsert.data.name,
        slug: platformInsert.data.slug,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo completar el setup inicial.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
