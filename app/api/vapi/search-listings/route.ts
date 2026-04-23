import { NextRequest, NextResponse } from "next/server";
import { fetchLiveListings, type LiveListing } from "@/lib/scrape-spectra";
import { applyPronunciationsWithDb } from "@/lib/pronunciations";
import { vowelizeHebrew } from "@/lib/nakdan";

export const revalidate = 3600;

// Vapi tool webhook — filters live listings and returns Hebrew-formatted matches
// Called by the AI agent during a call via function calling.

interface VapiToolCall {
  message?: {
    toolCalls?: Array<{
      id: string;
      function: { name: string; arguments: Record<string, unknown> };
    }>;
  };
}

interface SearchArgs {
  listing_type?: "rent" | "sale";
  rooms?: number;
  max_budget?: number;
  min_budget?: number;
  neighborhood?: string;
  property_type?: string;
  street?: string;
}

// Format price in natural Hebrew speech:
// 1,480,000 → "מיליון וארבע מאות ושמונים אלף שקל"
// 2,500,000 → "שני מיליון וחצי שקל"
// 4,500     → "ארבעת אלפים וחמש מאות שקל"
function formatPriceHebrew(price: number): string {
  if (price >= 1_000_000) {
    const millions = Math.floor(price / 1_000_000);
    const remainder = price % 1_000_000;
    const thousands = Math.round(remainder / 1000);
    const millionsWord = millions === 1 ? "מיליון" : millions === 2 ? "שני מיליון" : `${millions} מיליון`;
    if (thousands === 0) return `${millionsWord} שקל`;
    if (thousands === 500) return `${millionsWord} וחצי שקל`;
    return `${millionsWord} ו${thousands} אלף שקל`;
  }
  if (price >= 1000) {
    const thousands = Math.round(price / 1000);
    return `${thousands} אלף שקל`;
  }
  return `${price} שקל`;
}

function formatListingHebrew(l: LiveListing): string {
  const parts = [
    l.title.replace(/,\s*אריאל:.*$/, ""), // trim the long title
    l.rooms ? `${l.rooms} חדרים` : null,
    l.size_sqm ? `${l.size_sqm} מטר` : null,
    l.floor != null ? `קומה ${l.floor}` : null,
    l.neighborhood,
    formatPriceHebrew(l.price),
  ].filter(Boolean);
  let line = parts.join(", ");
  // Include ONLY the sentence from the description that contains a move-in
  // date hint (כניסה / פינוי / מיידי / תאריך). Skip marketing fluff so the
  // agent reads a short, clear summary instead of website copy.
  if (l.description) {
    const sentences = l.description.split(/[.!?]\s+/);
    const moveInSentence = sentences.find(s =>
      /כניסה|פינוי|מיידי|פנוי|זמין/.test(s)
    );
    if (moveInSentence) line += `. ${moveInSentence.trim()}`;
  }
  return line;
}

function streetMatches(l: LiveListing, queryStreet: string): boolean {
  const norm = (s: string) => s.replace(/['׳"״]/g, "").replace(/\s+/g, " ").trim();
  const q = norm(queryStreet);
  if (!q) return false;
  // Search across address, title, and description — many Spectra titles are
  // descriptive ("דירת גן חלומית...") so the street name only appears in the
  // body/description text.
  const haystack = norm(`${l.address} ${l.title} ${l.description ?? ""}`);
  return haystack.includes(q);
}

// Normalize neighborhood aliases so "רובע ראשון", "רובע אלף", "רובע א" all match
const NEIGHBORHOOD_ALIASES: Record<string, string[]> = {
  "רובע א": ["רובע א", "רובע אלף", "רובע ראשון", "ראשון"],
  "רובע ב": ["רובע ב", "רובע בית", "רובע שני", "שני"],
  "רובע ג": ["רובע ג", "רובע גימל", "רובע שלישי", "שלישי"],
  "רובע ד": ["רובע ד", "רובע דלת", "רובע רביעי", "רביעי"],
};

function neighborhoodMatches(listingN: string, queryN: string): boolean {
  const q = queryN.trim();
  // Direct match
  if (listingN.includes(q)) return true;
  // Check aliases — if query is any alias of a canonical, check canonical against listing
  for (const [canonical, aliases] of Object.entries(NEIGHBORHOOD_ALIASES)) {
    if (aliases.some(a => q.includes(a))) {
      return listingN.includes(canonical);
    }
  }
  return false;
}

function searchListings(listings: LiveListing[], args: SearchArgs): LiveListing[] {
  return listings.filter(l => {
    if (args.listing_type && l.listing_type !== args.listing_type) return false;
    if (args.rooms && l.rooms && Math.abs(l.rooms - args.rooms) > 0.5) return false;
    if (args.max_budget && l.price > args.max_budget) return false;
    if (args.min_budget && l.price < args.min_budget) return false;
    if (args.neighborhood && l.neighborhood && !neighborhoodMatches(l.neighborhood, args.neighborhood)) return false;
    if (args.property_type && l.property_type !== args.property_type) return false;
    if (args.street && !streetMatches(l, args.street)) return false;
    return true;
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as VapiToolCall;
  const toolCall = body.message?.toolCalls?.[0];
  if (!toolCall) return NextResponse.json({ error: "no tool call" }, { status: 400 });

  const args = toolCall.function.arguments as SearchArgs;
  const all = await fetchLiveListings();
  const matches = searchListings(all, args);

  let result: string;
  if (matches.length === 0) {
    result = "לא נמצאו נכסים מתאימים בקריטריונים שביקשת.";
  } else {
    // Speak about the first 5 in detail; summarize the rest so the agent can
    // honestly report the real total (prevents "I have 5 houses" when we
    // actually have more).
    const detailed = matches.slice(0, 5);
    const lines = detailed.map((l, i) => `${i + 1}. ${formatListingHebrew(l)}`);
    const tail = matches.length > 5 ? `\nסה״כ ${matches.length} נכסים תואמים — מוצגים כאן ${detailed.length} הראשונים, יש עוד ${matches.length - 5} זמינים.` : "";
    result = `מצאתי ${matches.length} נכסים:\n${lines.join("\n")}${tail}`;
  }

  // 1. Pronunciation dictionary — supplies vowelized replacements for abbreviations,
  //    rova letters, and any term Arik added via /settings/pronunciations.
  result = await applyPronunciationsWithDb(result);
  // 2. Nakdan — vowelize the remaining plain Hebrew. Nakdan preserves existing
  //    niqqud, so the dictionary's replacements survive.
  result = await vowelizeHebrew(result);

  return NextResponse.json({
    results: [{ toolCallId: toolCall.id, result }],
  });
}
