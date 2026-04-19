import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { original_text, phonetic_text, notes } = body as {
    original_text?: string;
    phonetic_text?: string;
    notes?: string | null;
  };

  const patch: Record<string, string | null> = {};
  if (typeof original_text === "string" && original_text.trim()) patch.original_text = original_text.trim();
  if (typeof phonetic_text === "string" && phonetic_text.trim()) patch.phonetic_text = phonetic_text.trim();
  if (notes !== undefined) patch.notes = notes?.toString().trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("pronunciations")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { error } = await svc.from("pronunciations").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
