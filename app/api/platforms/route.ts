import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/requireAuthUser";
import { canCreatePlatforms, getPlatformBootstrap } from "@/lib/server/platforms";

export async function GET(req: Request) {
  try {
    const { user } = await requireAuthUser(req);
    const bootstrap = await getPlatformBootstrap(user.id);

    return NextResponse.json({
      memberships: bootstrap.memberships,
      active_platform_id: bootstrap.activeMembership?.platform_id ?? null,
      can_create_platforms:
        !bootstrap.publicStatus.hasPlatforms || canCreatePlatforms(bootstrap.memberships),
      has_platforms: bootstrap.publicStatus.hasPlatforms,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar tus plataformas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
