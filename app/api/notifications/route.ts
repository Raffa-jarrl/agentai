import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { supabase, user } = await requireAgent();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, read, link, created_at")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH() {
  try {
    const { supabase, user } = await requireAgent();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("agent_id", user.id)
      .eq("read", false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
