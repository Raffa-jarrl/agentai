import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("pronunciations")
    .select("*")
    .order("original_text", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pronunciations: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { original_text, phonetic_text, notes } = body as {
    original_text?: string;
    phonetic_text?: string;
    notes?: string;
  };
  if (!original_text?.trim() || !phonetic_text?.trim()) {
    return NextResponse.json({ error: "original_text and phonetic_text are required" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("pronunciations")
    .insert({ original_text: original_text.trim(), phonetic_text: phonetic_text.trim(), notes: notes?.trim() || null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
