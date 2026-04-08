import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/requireAuthUser";
import { getPlatformBootstrap } from "@/lib/server/platforms";

export async function GET(req: Request) {
  try {
    const { user } = await requireAuthUser(req);
    const bootstrap = await getPlatformBootstrap(user.id);

    return NextResponse.json({
      session: {
        email: user.email ?? "",
      },
      profile: bootstrap.profile,
      settings: bootstrap.settings,
      public_status: {
        has_platforms: bootstrap.publicStatus.hasPlatforms,
        platform_name: bootstrap.publicStatus.platformName,
        support_email: bootstrap.publicStatus.supportEmail,
        auth_provider: bootstrap.publicStatus.authProvider,
      },
      access: {
        memberships: bootstrap.memberships,
        active_membership: bootstrap.activeMembership,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el bootstrap de la app.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
