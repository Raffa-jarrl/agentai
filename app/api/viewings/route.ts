import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireAgent();
    const upcoming = req.nextUrl.searchParams.get("upcoming") === "true";

    let query = supabase
      .from("viewings")
      .select("id, scheduled_at, status, notes, outcome, client_feedback, lead:leads(id, full_name, phone), listing:listings(id, title, city)")
      .eq("lead.agent_id", user.id)
      .order("scheduled_at");

    if (upcoming) {
      const now = new Date().toISOString();
      const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("scheduled_at", now).lte("scheduled_at", in7);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase } = await requireAgent();
    const body = await req.json() as { lead_id: string; listing_id: string; scheduled_at: string; notes?: string };

    const { data, error } = await supabase
      .from("viewings")
      .insert({
        lead_id: body.lead_id,
        listing_id: body.listing_id,
        scheduled_at: body.scheduled_at,
        notes: body.notes ?? null,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
