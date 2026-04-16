import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/supabase/server";

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase } = await requireAgent();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
