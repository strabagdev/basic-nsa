import { NextResponse } from "next/server";
import { getPublicPlatformStatus } from "@/lib/server/platforms";

export async function GET() {
  try {
    const status = await getPublicPlatformStatus();
    return NextResponse.json({
      has_platforms: status.hasPlatforms,
      platform_name: status.platformName,
      support_email: status.supportEmail,
      auth_provider: status.authProvider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el estado público.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
