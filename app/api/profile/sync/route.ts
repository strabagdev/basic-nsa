import { NextResponse } from "next/server";
import { createDataServerClient } from "@/lib/supabase/dataServer";
import { requireAuthUser } from "@/lib/server/requireAuthUser";

export async function POST(req: Request) {
  try {
    const { user } = await requireAuthUser(req);
    const supabase = createDataServerClient();
    const email = user.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Authenticated user has no email." }, { status: 400 });
    }

    const payload = {
      id: user.id,
      email,
      full_name:
        typeof user.user_metadata?.full_name === "string"
          ? String(user.user_metadata.full_name).trim() || null
          : null,
      avatar_url:
        typeof user.user_metadata?.avatar_url === "string"
          ? String(user.user_metadata.avatar_url).trim() || null
          : null,
      last_seen_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("id, email, full_name, avatar_url, last_seen_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
