import { NextResponse } from "next/server";
import { anthropic, cachedSystem, MODEL_SMART } from "@/lib/anthropic/client";
import { LEAD_QUALIFICATION } from "@/lib/anthropic/prompts";
import { createServiceClient } from "@/lib/supabase/server";
import { scoreLead } from "@/lib/scoring/leadScore";
import { runMatchingForLead } from "@/lib/matching/runMatching";
import type { ConversationMessage, LeadTimeline } from "@/types/database";

/** Given a conversation, run the qualification prompt and (if complete) update the lead. */
export async function POST(req: Request) {
  const { lead_id, agent_id } = await req.json();
  if (!lead_id || !agent_id) return NextResponse.json({ error: "lead_id + agent_id required" }, { status: 400 });

  const svc = createServiceClient();
  const { data: convo } = await svc
    .from("conversations")
    .select("id, messages, qualification_complete")
    .eq("lead_id", lead_id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!convo) return NextResponse.json({ error: "no conversation" }, { status: 404 });

  const history = (convo.messages as ConversationMessage[])
    .map((m) => `${m.role === "user" ? "לקוח" : "סוכן"}: ${m.content}`)
    .join("\n");

  const res = await anthropic().messages.create({
    model: MODEL_SMART,
    max_tokens: 1200,
    system: cachedSystem(LEAD_QUALIFICATION),
    messages: [
      { role: "user", content: `שיחה עד כה:\n${history}\n\nאם יש לך מספיק מידע, החזר JSON עם הפרופיל. אחרת החזר את השאלה הבאה שכדאי לשאול בצורת טקסט רגיל.` },
    ],
  });

  const text = res.content.filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text").map((b) => b.text).join("\n").trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ complete: false, next_message: text });
  }

  let profile: Record<string, unknown>;
  try {
    profile = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ complete: false, next_message: text });
  }

  const patch: Record<string, unknown> = {};
  if (typeof profile.full_name === "string") patch.full_name = profile.full_name;
  if (Array.isArray(profile.preferred_areas)) patch.preferred_areas = profile.preferred_areas;
  if (typeof profile.budget_min === "number") patch.budget_min = profile.budget_min;
  if (typeof profile.budget_max === "number") patch.budget_max = profile.budget_max;
  if (typeof profile.preferred_rooms === "number") patch.preferred_rooms = profile.preferred_rooms;
  if (typeof profile.mortgage_approved === "boolean") patch.mortgage_approved = profile.mortgage_approved;
  if (typeof profile.mortgage_amount === "number") patch.mortgage_amount = profile.mortgage_amount;
  if (typeof profile.timeline === "string") patch.timeline = profile.timeline as LeadTimeline;
  patch.status = "qualified";

  await svc.from("leads").update(patch).eq("id", lead_id);
  await svc.from("conversations").update({ qualification_complete: true, summary: String(profile.summary ?? "") }).eq("id", convo.id);

  // Recompute score
  const { data: updated } = await svc
    .from("leads")
    .select("mortgage_approved, budget_min, budget_max, timeline, last_contact_at")
    .eq("id", lead_id)
    .single();
  const { data: activeListings = [] } = await svc.from("listings").select("price").eq("agent_id", agent_id).eq("status", "active");
  if (updated) {
    const s = scoreLead({ lead: updated, activeListings: activeListings ?? [] });
    await svc.from("leads").update({ score: s.tier, score_value: s.value }).eq("id", lead_id);
  }

  await runMatchingForLead(lead_id, agent_id, svc);
  return NextResponse.json({ complete: true, profile });
}
