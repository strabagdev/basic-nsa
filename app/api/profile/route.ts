import { NextResponse } from "next/server";
import { createDataServerClient } from "@/lib/supabase/dataServer";
import { requireAuthUser } from "@/lib/server/requireAuthUser";

export async function PATCH(req: Request) {
  try {
    const { user } = await requireAuthUser(req);
    const body = (await req.json().catch(() => ({}))) as {
      full_name?: unknown;
      avatar_url?: unknown;
    };

    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url.trim() : "";

    const supabase = createDataServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id, email, full_name, avatar_url, last_seen_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
