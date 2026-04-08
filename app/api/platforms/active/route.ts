import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/requireAuthUser";
import { setActivePlatform } from "@/lib/server/platforms";

export async function POST(req: Request) {
  try {
    const { user } = await requireAuthUser(req);
    const body = (await req.json().catch(() => ({}))) as { platformId?: unknown };
    const platformId = typeof body.platformId === "string" ? body.platformId.trim() : "";

    if (!platformId) {
      return NextResponse.json({ error: "platformId es requerido." }, { status: 400 });
    }

    const membership = await setActivePlatform(user.id, platformId);
    return NextResponse.json({ active_membership: membership });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo activar la plataforma.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
