import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireAgent();
    const body = await req.json() as { status?: string; notes?: string; outcome?: string; client_feedback?: string };

    const { data, error } = await supabase
      .from("viewings")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireAgent();
    const { error } = await supabase.from("viewings").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
