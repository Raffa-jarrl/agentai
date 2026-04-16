import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { supabase, user } = await requireAgent();
    const [{ data: listings }, { data: leads }] = await Promise.all([
      supabase.from("listings").select("id, title, city").eq("agent_id", user.id).eq("status", "active"),
      supabase.from("leads").select("id, full_name, phone").eq("agent_id", user.id).not("status", "in", '("closed_lost","inactive")'),
    ]);
    return NextResponse.json({ listings: listings ?? [], leads: leads ?? [] });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
