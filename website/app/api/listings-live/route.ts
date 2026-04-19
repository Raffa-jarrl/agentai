import { NextResponse } from "next/server";
import { fetchLiveListings } from "@/lib/scrape-spectra";

// Cache for 1 hour — source of truth is the live website.
// First request each hour scrapes; subsequent requests served from cache.
export const revalidate = 3600;

export async function GET() {
  try {
    const listings = await fetchLiveListings();
    return NextResponse.json({ count: listings.length, listings }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
