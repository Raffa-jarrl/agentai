import type { Lead, Listing } from "@/types/database";

export interface MatchResult {
  score: number;
  reasons: string[];
}

const norm = (s: string) => s.trim().toLowerCase();

/** Weighted compatibility score (0-100) between a lead and a listing. */
export function matchLeadToListing(
  lead: Pick<Lead, "budget_min" | "budget_max" | "preferred_rooms" | "preferred_areas" | "mortgage_approved">,
  listing: Pick<Listing, "price" | "rooms" | "city" | "neighborhood">,
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // Budget overlap — 40 points
  if (lead.budget_min != null && lead.budget_max != null) {
    if (listing.price >= lead.budget_min && listing.price <= lead.budget_max) {
      score += 40;
      reasons.push("budget_match");
    } else {
      // Close-to-range partial credit (±10%)
      const outsideBy = listing.price < lead.budget_min
        ? lead.budget_min - listing.price
        : listing.price - lead.budget_max;
      const tolerance = lead.budget_max * 0.1;
      if (outsideBy <= tolerance) {
        score += 20;
        reasons.push("budget_close");
      }
    }
  }

  // Area match — 30 points
  if (lead.preferred_areas.length > 0) {
    const areas = lead.preferred_areas.map(norm);
    const haystack = [listing.city, listing.neighborhood].filter(Boolean).map((s) => norm(s!));
    const hit = haystack.some((h) => areas.some((a) => h.includes(a) || a.includes(h)));
    if (hit) {
      score += 30;
      reasons.push("area_match");
    }
  }

  // Rooms match — 20 points (tolerance of 0.5)
  if (lead.preferred_rooms != null && listing.rooms != null) {
    const diff = Math.abs(Number(listing.rooms) - Number(lead.preferred_rooms));
    if (diff <= 0.5) {
      score += 20;
      reasons.push("rooms_match");
    } else if (diff <= 1) {
      score += 10;
      reasons.push("rooms_close");
    }
  }

  // Mortgage approved — 10 points (signals readiness)
  if (lead.mortgage_approved) {
    score += 10;
    reasons.push("mortgage_approved");
  }

  return { score: Math.min(100, score), reasons };
}
