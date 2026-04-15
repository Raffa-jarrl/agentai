"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { leadSchema } from "@/lib/validation/schemas";
import { scoreLead } from "@/lib/scoring/leadScore";
import { runMatchingForLead } from "@/lib/matching/runMatching";
import { normalizeIsraeliPhone } from "@/lib/formatters/phone";
import type { LeadStatus } from "@/types/database";

export async function createLead(raw: unknown) {
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "פרטים לא תקינים" };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const phone = normalizeIsraeliPhone(parsed.data.phone) ?? parsed.data.phone;

  const { data: activeListings = [] } = await supabase
    .from("listings")
    .select("price")
    .eq("agent_id", user.id)
    .eq("status", "active");

  const score = scoreLead({
    lead: {
      mortgage_approved: parsed.data.mortgage_approved ?? null,
      budget_min: parsed.data.budget_min ?? null,
      budget_max: parsed.data.budget_max ?? null,
      timeline: parsed.data.timeline ?? null,
      last_contact_at: null,
    },
    activeListings: activeListings ?? [],
  });

  const { data, error } = await supabase
    .from("leads")
    .insert({
      agent_id: user.id,
      ...parsed.data,
      phone,
      score: score.tier,
      score_value: score.value,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await runMatchingForLead(data.id, user.id);
  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

export async function recomputeLeadScore(leadId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  const { data: lead } = await supabase
    .from("leads")
    .select("mortgage_approved, budget_min, budget_max, timeline, last_contact_at")
    .eq("id", leadId)
    .single();
  if (!lead) return { error: "not found" };

  const { data: listings = [] } = await supabase
    .from("listings")
    .select("price")
    .eq("agent_id", user.id)
    .eq("status", "active");

  const s = scoreLead({ lead, activeListings: listings ?? [] });
  await supabase.from("leads").update({ score: s.tier, score_value: s.value }).eq("id", leadId);
  revalidatePath(`/leads/${leadId}`);
  return { ok: true, ...s };
}
