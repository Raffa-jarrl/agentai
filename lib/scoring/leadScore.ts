import type { Lead, LeadScoreTier, Listing } from "@/types/database";

export interface ScoreInput {
  lead: Pick<
    Lead,
    | "mortgage_approved"
    | "budget_min"
    | "budget_max"
    | "timeline"
    | "last_contact_at"
  >;
  activeListings: Pick<Listing, "price">[];
  /** Number of inbound vs outbound messages over the lead lifetime. */
  engagement?: { inbound: number; outbound: number };
  now?: Date;
}

export interface ScoreResult {
  value: number;
  tier: LeadScoreTier;
  reasons: string[];
}

const HOT_THRESHOLD = 70;
const WARM_THRESHOLD = 40;

export function scoreLead({ lead, activeListings, engagement, now = new Date() }: ScoreInput): ScoreResult {
  let value = 0;
  const reasons: string[] = [];

  if (lead.mortgage_approved) {
    value += 30;
    reasons.push("mortgage_approved");
  }

  if (lead.budget_min != null && lead.budget_max != null && activeListings.length > 0) {
    const fits = activeListings.some((l) => l.price >= lead.budget_min! && l.price <= lead.budget_max!);
    if (fits) {
      value += 20;
      reasons.push("budget_matches_listing");
    }
  }

  if (lead.timeline === "immediate") {
    value += 25;
    reasons.push("timeline_immediate");
  } else if (lead.timeline === "1_3_months") {
    value += 12;
    reasons.push("timeline_short");
  }

  if (lead.last_contact_at) {
    const ageDays = (now.getTime() - new Date(lead.last_contact_at).getTime()) / 86_400_000;
    if (ageDays <= 3) {
      value += 15;
      reasons.push("recent_response");
    }
  }

  if (engagement && engagement.outbound > 0) {
    const ratio = engagement.inbound / engagement.outbound;
    if (ratio >= 0.8) {
      value += 10;
      reasons.push("high_engagement");
    } else if (ratio >= 0.4) {
      value += 5;
      reasons.push("moderate_engagement");
    }
  }

  value = Math.min(100, value);
  const tier: LeadScoreTier = value >= HOT_THRESHOLD ? "hot" : value >= WARM_THRESHOLD ? "warm" : "cold";
  return { value, tier, reasons };
}
