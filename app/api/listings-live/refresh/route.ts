import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshLiveListings } from "@/lib/scrape-spectra";

// POST /api/listings-live/refresh
// Force-refresh the in-memory listings cache by re-scraping spectra-nadlan.co.il.
// Use after Arik adds/removes listings on the website.
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const fresh = await refreshLiveListings();
    return NextResponse.json({
      ok: true,
      count: fresh.length,
      sale: fresh.filter(l => l.listing_type === "sale").length,
      rent: fresh.filter(l => l.listing_type === "rent").length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "refresh error" },
      { status: 500 }
    );
  }
}
