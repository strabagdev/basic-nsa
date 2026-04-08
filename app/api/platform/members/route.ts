import { NextResponse } from "next/server";
import { findAuthUserIdByEmail, createSupabaseAdminClient } from "@/lib/server/authAdmin";
import { getPublicAppUrl } from "@/lib/server/publicAppOrigin";
import { canManagePlatform, getCurrentActiveMembership, getPlatformBootstrap } from "@/lib/server/platforms";
import { requireAuthUser } from "@/lib/server/requireAuthUser";
import { createDataServerClient } from "@/lib/supabase/dataServer";

type Role = "super_admin" | "platform_admin" | "platform_user";

export async function GET(req: Request) {
  try {
    const { user } = await requireAuthUser(req);
    const activeMembership = await getCurrentActiveMembership(user.id);
    if (!activeMembership) {
      return NextResponse.json({ error: "No tienes una plataforma activa." }, { status: 400 });
    }

    if (!canManagePlatform(activeMembership.role)) {
      return NextResponse.json({ error: "No tienes permisos para gestionar miembros." }, { status: 403 });
    }

    const db = createDataServerClient();
    const { data, error } = await db
      .from("platform_memberships")
      .select("id, role, status, invited_email, created_at, user:profiles(id, email, full_name)")
      .eq("platform_id", activeMembership.platform_id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const members = (data ?? []).map((row) => {
      const userProfile = Array.isArray(row.user) ? row.user[0] : row.user;
      return {
        id: String(row.id),
        role: String(row.role),
        status: String(row.status),
        invited_email: row.invited_email ? String(row.invited_email) : null,
        email: userProfile?.email ? String(userProfile.email) : row.invited_email ? String(row.invited_email) : "",
        full_name: userProfile?.full_name ? String(userProfile.full_name) : null,
        user_id: userProfile?.id ? String(userProfile.id) : null,
      };
    });

    return NextResponse.json({
      active_platform: activeMembership,
      members,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar los miembros.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requireAuthUser(req);
    const bootstrap = await getPlatformBootstrap(user.id);
    const activeMembership = bootstrap.activeMembership;

    if (!activeMembership) {
      return NextResponse.json({ error: "No tienes una plataforma activa." }, { status: 400 });
    }
    if (!canManagePlatform(activeMembership.role)) {
      return NextResponse.json({ error: "No tienes permisos para invitar miembros." }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      email?: unknown;
      role?: unknown;
    };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = (typeof body.role === "string" ? body.role.trim() : "") as Role;
    if (!email || !["super_admin", "platform_admin", "platform_user"].includes(role)) {
      return NextResponse.json({ error: "Email y role válidos son requeridos." }, { status: 400 });
    }

    const db = createDataServerClient();
    const admin = createSupabaseAdminClient();
    let invitedUserId = await findAuthUserIdByEmail(email);

    if (!invitedUserId) {
      const redirectTo = getPublicAppUrl(req, "/auth/callback");
      const inviteResult = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
      });
      if (inviteResult.error) {
        return NextResponse.json({ error: inviteResult.error.message }, { status: 400 });
      }
      invitedUserId = inviteResult.data.user?.id ?? null;
    }

    if (!invitedUserId) {
      return NextResponse.json({ error: "No se pudo resolver el usuario invitado." }, { status: 400 });
    }

    const profileUpsert = await db.from("profiles").upsert(
      {
        id: invitedUserId,
        email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (profileUpsert.error) throw profileUpsert.error;

    const membershipUpsert = await db
      .from("platform_memberships")
      .upsert(
        {
          platform_id: activeMembership.platform_id,
          user_id: invitedUserId,
          role,
          status: "active",
          invited_email: email,
        },
        { onConflict: "platform_id,user_id" }
      )
      .select("id")
      .single();
    if (membershipUpsert.error) throw membershipUpsert.error;

    return NextResponse.json({
      invited: {
        id: membershipUpsert.data.id,
        user_id: invitedUserId,
        email,
        role,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo invitar al miembro.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
