import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { supabase, user } = await requireAgent();
    const { data, error } = await supabase
      .from("leads")
      .select("full_name, phone, source, status, score, budget_min, budget_max, preferred_rooms, preferred_areas, mortgage_approved, timeline, potential_commission, created_at")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const headers = ["שם", "טלפון", "מקור", "סטטוס", "ציון", "תקציב_מינ", "תקציב_מקס", "חדרים", "אזורים", "משכנתא", "ציר_זמן", "עמלה_פוטנציאלית", "נוצר"];
    const rows = (data ?? []).map((l) => [
      l.full_name,
      l.phone,
      l.source,
      l.status,
      l.score,
      l.budget_min ?? "",
      l.budget_max ?? "",
      l.preferred_rooms ?? "",
      (l.preferred_areas ?? []).join(";"),
      l.mortgage_approved === true ? "כן" : l.mortgage_approved === false ? "לא" : "",
      l.timeline ?? "",
      l.potential_commission ?? "",
      l.created_at,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const BOM = "\uFEFF";
    return new NextResponse(BOM + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leads.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
