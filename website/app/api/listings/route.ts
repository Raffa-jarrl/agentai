import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  let q = supabaseAdmin
    .from("listings")
    .select("id, title, city, neighborhood, price, rooms, size_sqm, status, photos, property_type, description, floor, address")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (type === "rent") q = q.eq("status", "rented");
  else if (type === "commercial") q = (q as typeof q).eq("property_type", "commercial");

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
