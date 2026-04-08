import { NextResponse } from "next/server";
import { createDataServerClient } from "@/lib/supabase/dataServer";
import { requireAuthUser } from "@/lib/server/requireAuthUser";

export async function GET(req: Request) {
  try {
    const { user } = await requireAuthUser(req);
    const supabase = createDataServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, last_seen_at")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load current user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
