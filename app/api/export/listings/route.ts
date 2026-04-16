import { NextResponse } from "next/server";
import { requireAgent } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { supabase, user } = await requireAgent();
    const { data, error } = await supabase
      .from("listings")
      .select("title, city, neighborhood, property_type, rooms, size_sqm, price, status, floor, parking, elevator, renovated, created_at")
      .eq("agent_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const headers = ["כותרת", "עיר", "שכונה", "סוג", "חדרים", "מ״ר", "מחיר", "סטטוס", "קומה", "חניה", "מעלית", "משופץ", "נוצר"];
    const rows = (data ?? []).map((l) => [
      l.title,
      l.city,
      l.neighborhood ?? "",
      l.property_type,
      l.rooms ?? "",
      l.size_sqm ?? "",
      l.price,
      l.status,
      l.floor ?? "",
      l.parking === true ? "כן" : l.parking === false ? "לא" : "",
      l.elevator === true ? "כן" : l.elevator === false ? "לא" : "",
      l.renovated === true ? "כן" : l.renovated === false ? "לא" : "",
      l.created_at,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const BOM = "\uFEFF";
    return new NextResponse(BOM + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="listings.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
