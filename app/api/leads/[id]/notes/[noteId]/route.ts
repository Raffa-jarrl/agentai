import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/supabase/server";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; noteId: string } }) {
  try {
    const { supabase } = await requireAgent();
    const { error } = await supabase
      .from("lead_notes")
      .delete()
      .eq("id", params.noteId)
      .eq("lead_id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
