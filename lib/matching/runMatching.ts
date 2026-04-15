import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { matchLeadToListing } from "./listingMatch";

const THRESHOLD = 40;

function resolveClient(client?: SupabaseClient) {
  return client ?? createClient();
}

/** Compute + upsert matches for a new/updated listing against all active leads. */
export async function runMatchingForListing(listingId: string, agentId: string, client?: SupabaseClient) {
  const supabase = resolveClient(client);
  const [{ data: listing }, { data: leads }] = await Promise.all([
    supabase.from("listings").select("id, price, rooms, city, neighborhood").eq("id", listingId).eq("agent_id", agentId).single(),
    supabase
      .from("leads")
      .select("id, budget_min, budget_max, preferred_rooms, preferred_areas, mortgage_approved")
      .eq("agent_id", agentId)
      .in("status", ["new", "contacted", "qualified", "viewing_scheduled", "negotiating"]),
  ]);

  if (!listing || !leads?.length) return { created: 0 };

  const rows = leads
    .map((lead) => ({ lead, ...matchLeadToListing(lead, listing) }))
    .filter((r) => r.score >= THRESHOLD)
    .map((r) => ({
      agent_id: agentId,
      lead_id: r.lead.id,
      listing_id: listing.id,
      match_score: r.score,
      match_reasons: r.reasons,
    }));

  if (!rows.length) return { created: 0 };
  const { error } = await supabase.from("lead_listing_matches").upsert(rows, { onConflict: "lead_id,listing_id" });
  if (error) throw error;
  return { created: rows.length };
}

/** Compute + upsert matches for a new/updated lead against all active listings. */
export async function runMatchingForLead(leadId: string, agentId: string, client?: SupabaseClient) {
  const supabase = resolveClient(client);
  const [{ data: lead }, { data: listings }] = await Promise.all([
    supabase.from("leads").select("id, budget_min, budget_max, preferred_rooms, preferred_areas, mortgage_approved").eq("id", leadId).eq("agent_id", agentId).single(),
    supabase.from("listings").select("id, price, rooms, city, neighborhood").eq("agent_id", agentId).eq("status", "active"),
  ]);

  if (!lead || !listings?.length) return { created: 0 };

  const rows = listings
    .map((listing) => ({ listing, ...matchLeadToListing(lead, listing) }))
    .filter((r) => r.score >= THRESHOLD)
    .map((r) => ({
      agent_id: agentId,
      lead_id: lead.id,
      listing_id: r.listing.id,
      match_score: r.score,
      match_reasons: r.reasons,
    }));

  if (!rows.length) return { created: 0 };
  const { error } = await supabase.from("lead_listing_matches").upsert(rows, { onConflict: "lead_id,listing_id" });
  if (error) throw error;
  return { created: rows.length };
}

// Re-export service client for convenience in webhook code paths.
export { createServiceClient };
