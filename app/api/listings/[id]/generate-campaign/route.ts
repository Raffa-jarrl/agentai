import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { anthropic, cachedSystem } from "@/lib/anthropic/client";
import { CAMPAIGN_GENERATION } from "@/lib/anthropic/prompts";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data: listing } = await svc.from("listings").select("*").eq("id", params.id).single();
  if (!listing || listing.agent_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { submission_id } = await req.json() as { submission_id?: string };

  const propertyDetails = `
נכס: ${listing.title}
סוג: ${listing.property_type}
חדרים: ${listing.rooms}
גודל: ${listing.size_sqm} מ"ר
מחיר: ₪${(listing.price as number | null)?.toLocaleString()}
עיר: ${listing.city}
שכונה: ${(listing.neighborhood as string | null) ?? ""}
קומה: ${(listing.floor as string | null) ?? ""} מתוך ${(listing.total_floors as string | null) ?? ""}
חניה: ${listing.parking ? "כן" : "לא"}
מעלית: ${listing.elevator ? "כן" : "לא"}
משופץ: ${listing.renovated ? "כן" : "לא"}
תיאור קיים: ${(listing.description as string | null) ?? (listing.ai_generated_description as string | null) ?? ""}
  `.trim();

  const client = anthropic();
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: cachedSystem(CAMPAIGN_GENERATION),
    messages: [{ role: "user", content: `צור קמפיין שיווקי מלא לנכס הבא:\n\n${propertyDetails}` }],
  });

  const firstBlock = msg.content[0];
  const text = firstBlock?.type === "text" ? firstBlock.text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: "Failed to parse campaign" }, { status: 500 });

  const campaign = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const { data, error } = await svc.from("listing_campaigns").insert({
    listing_id: params.id,
    agent_id: user.id,
    submission_id: submission_id ?? null,
    ...campaign,
    status: "draft",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
