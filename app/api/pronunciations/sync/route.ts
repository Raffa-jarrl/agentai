import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { vowelizeHebrew } from "@/lib/nakdan";

// POST /api/pronunciations/sync
// Re-runs every DB entry's original_text through DICTA Nakdan and updates
// phonetic_text when Nakdan disagrees. Preserves entries tagged with
// "manual" in notes so Arik's deliberate overrides aren't clobbered.
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data: rows, error } = await svc
    .from("pronunciations")
    .select("id,original_text,phonetic_text,notes");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const changes: Array<{ original: string; from: string; to: string }> = [];
  let skipped = 0;
  let unchanged = 0;

  for (const row of rows ?? []) {
    if ((row.notes ?? "").includes("manual")) {
      skipped++;
      continue;
    }
    const vowelized = await vowelizeHebrew(row.original_text);
    // Nakdan returning identical text = it couldn't vowelize; keep existing.
    if (!vowelized || vowelized === row.original_text) {
      unchanged++;
      continue;
    }
    if (vowelized === row.phonetic_text) {
      unchanged++;
      continue;
    }
    const { error: upErr } = await svc
      .from("pronunciations")
      .update({ phonetic_text: vowelized })
      .eq("id", row.id);
    if (!upErr) {
      changes.push({ original: row.original_text, from: row.phonetic_text, to: vowelized });
    }
  }

  return NextResponse.json({
    total: rows?.length ?? 0,
    updated: changes.length,
    unchanged,
    skipped_manual: skipped,
    changes: changes.slice(0, 30),
  });
}
