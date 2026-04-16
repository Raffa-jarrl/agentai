import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireAgent();
    const { data, error } = await supabase
      .from("lead_notes")
      .select("id, content, created_at")
      .eq("lead_id", params.id)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, user } = await requireAgent();
    const body = await req.json() as { content: string };
    const { data, error } = await supabase
      .from("lead_notes")
      .insert({ lead_id: params.id, agent_id: user.id, content: body.content })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
