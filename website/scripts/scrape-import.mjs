/**
 * Scrapes all real listings from spectra-nadlan.co.il and imports them into Supabase.
 * Clears fake/demo data first.
 * Run: node scripts/scrape-import.mjs
 */
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE = "https://www.spectra-nadlan.co.il";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" }
  });
  return res.text();
}

// Catalog pages to scrape for property links
const CATALOG_URLS = [
  `${BASE}/%d7%a7%d7%98%d7%9c%d7%95%d7%92-%d7%94%d7%a0%d7%9b%d7%a1%d7%99%d7%9d/`,
  `${BASE}/%d7%a7%d7%98%d7%9c%d7%95%d7%92-%d7%94%d7%a0%d7%9b%d7%a1%d7%99%d7%9d/%d7%93%d7%99%d7%a8%d7%95%d7%aa-%d7%9c%d7%9e%d7%9b%d7%99%d7%a8%d7%94-%d7%91%d7%90%d7%a8%d7%99%d7%90%d7%9c/`,
  `${BASE}/%d7%a7%d7%98%d7%9c%d7%95%d7%92-%d7%94%d7%a0%d7%9b%d7%a1%d7%99%d7%9d/%d7%91%d7%aa%d7%99%d7%9d-%d7%9c%d7%9e%d7%9b%d7%99%d7%a8%d7%94-%d7%91%d7%90%d7%a8%d7%99%d7%90%d7%9c/`,
  `${BASE}/%d7%a7%d7%98%d7%9c%d7%95%d7%92-%d7%94%d7%a0%d7%9b%d7%a1%d7%99%d7%9d/%d7%93%d7%99%d7%a8%d7%95%d7%aa-%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94-%d7%91%d7%90%d7%a8%d7%99%d7%90%d7%9c/`,
  `${BASE}/%d7%a7%d7%98%d7%9c%d7%95%d7%92-%d7%94%d7%a0%d7%9b%d7%a1%d7%99%d7%9d/%d7%a0%d7%93%d7%9c%d7%9f-%d7%9e%d7%a1%d7%97%d7%a8%d7%99-%d7%91%d7%90%d7%a8%d7%99%d7%90%d7%9c-%d7%9e%d7%a9%d7%a8%d7%93%d7%99%d7%9d-%d7%97%d7%a0%d7%95%d7%99%d7%95%d7%aa-%d7%95%d7%aa%d7%a2%d7%a9/`,
  `${BASE}/%d7%a7%d7%98%d7%9c%d7%95%d7%92-%d7%94%d7%a0%d7%9b%d7%a1%d7%99%d7%9d/%d7%94%d7%a9%d7%a7%d7%a2%d7%95%d7%aa-%d7%a0%d7%93%d7%9c%d7%9f-%d7%91%d7%90%d7%a8%d7%99%d7%90%d7%9c/`,
];

async function collectPropertyUrls() {
  const urls = new Set();
  for (const catUrl of CATALOG_URLS) {
    console.log(`Scanning catalog: ${catUrl}`);
    const html = await fetchPage(catUrl);
    const $ = cheerio.load(html);
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.includes("/נכס/") || href.includes("/%D7%A0%D7%9B%D7%A1/") || href.includes("/%d7%a0%d7%9b%d7%a1/")) {
        urls.add(href.split("?")[0]);
      }
    });
  }
  return [...urls];
}

function mapPropertyType(typeHe) {
  const map = {
    "דירה": "apartment",
    "בית": "house",
    "בית פרטי": "house",
    "וילה": "house",
    "דו משפחתי": "house",
    "צמוד קרקע": "house",
    "קוטג": "house",
    "דירת גן": "garden_apt",
    "דופלקס": "duplex",
    "פנטהאוז": "penthouse",
    "גג": "penthouse",
    "מסחרי": "commercial",
    "משרד": "commercial",
    "חנות": "commercial",
    "תעשיה": "commercial",
    "קרקע": "land",
    "מגרש": "land",
  };
  for (const [he, en] of Object.entries(map)) {
    if (typeHe && typeHe.includes(he)) return en;
  }
  return "apartment";
}

function parsePrice(text) {
  const m = text.match(/₪([\d,]+)/);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ""));
}

function parseNum(text) {
  const m = text.match(/\d+/);
  return m ? parseInt(m[0]) : null;
}

function extractNeighborhood(address) {
  // Ariel neighborhoods: מוריה, נווה שאנן, רובע א-ד, יפה נוף, מרכז העיר
  const neighborhoods = ["מוריה", "נווה שאנן", "רובע א", "רובע ב", "רובע ג", "רובע ד", "יפה נוף", "השרון"];
  for (const n of neighborhoods) {
    if (address && address.includes(n)) return n;
  }
  return null;
}

async function scrapeListing(url) {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim() || $("title").text().split(" - ")[0].trim();

  // Price
  const priceText = $("body").text();
  const price = parsePrice(priceText);

  // Use full page text for structured data extraction
  const bodyText = $("body").text();

  // Extract sqm — look for "שטח בנוי\n  NUMBER מ" pattern
  const sqmMatch2 = bodyText.match(/שטח בנוי\s*\n?\s*(\d{2,4})\s*מ/);
  const sqmMatch3 = bodyText.match(/(\d{2,4})\s*מ״ר/);

  // Extract floor
  const floorMatch2 = bodyText.match(/(?:^|\n)\s*(\d{1,2})\s*\n\s*קומה/m);
  const floorMatch3 = bodyText.match(/קומה\s*\n?\s*(\d{1,2})/);

  // Extract rooms
  const roomsMatch2 = bodyText.match(/(?:^|\n)\s*(\d{1,2}(?:\.\d)?)\s*\n\s*חד/m);
  const roomsMatch3 = bodyText.match(/(\d{1,2}(?:\.\d)?)\s*חד/);

  // Extract property type from structured details
  const typeMatch = bodyText.match(/סוג נכס\s*\n?\s*([^\n]{2,20})/);

  // Listing type from status line
  const listingTypeMatch = bodyText.match(/סטטוס נכס\s*\n?\s*([^\n]+)/);

  const details = {
    sqm: sqmMatch2 ? parseInt(sqmMatch2[1]) : (sqmMatch3 ? parseInt(sqmMatch3[1]) : null),
    floor: floorMatch2 ? parseInt(floorMatch2[1]) : (floorMatch3 ? parseInt(floorMatch3[1]) : null),
    rooms: roomsMatch2 ? parseFloat(roomsMatch2[1]) : (roomsMatch3 ? parseFloat(roomsMatch3[1]) : null),
    type: typeMatch ? typeMatch[1].trim() : "",
    listing_type: listingTypeMatch && listingTypeMatch[1].includes("השכרה") ? "rent" : "sale",
  };

  // Better rooms extraction from title
  const roomsFromTitle = title.match(/(\d+)\s*חד/);
  if (roomsFromTitle && !details.rooms) details.rooms = parseInt(roomsFromTitle[1]);

  // Listing type from URL
  let listing_type = details.listing_type || "sale";
  if (url.includes("להשכרה") || url.includes("%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94")) listing_type = "rent";

  // Address from title (format: "רחוב X, אריאל: ...")
  const addressMatch = title.match(/^(.+?),\s*אריאל/);
  const address = addressMatch ? addressMatch[1].trim() : "";

  // Neighborhood from address
  const neighborhood = extractNeighborhood(address) || extractNeighborhood(title);

  // Description (longest paragraph)
  let description = "";
  $("p").each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > description.length && t.length > 50 && !t.includes("תנאי שימוש")) {
      description = t;
    }
  });

  // Photos — WordPress uploads
  const photos = [];
  $("img[src*='uploads'], img[src*='spectra-nadlan']").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src.includes("uploads") && !src.includes("logo") && !src.includes("icon")) {
      // Get full-size (remove -WxH suffix)
      const full = src.replace(/-\d+x\d+(\.\w+)$/, "$1");
      if (!photos.includes(full)) photos.push(full);
    }
  });

  // Property type
  const typeHe = details.type || "";
  const typeEl = $("body").text().match(/סוג נכס\s*\n?\s*([^\n]+)/);
  const property_type = mapPropertyType(typeHe || typeEl?.[1] || title);

  // Map listing_type to status for rent (active = for sale, rented = for rent display)
  // We'll also store it in a separate column once added
  const statusVal = listing_type === "rent" ? "rented" : "active";

  return {
    title: title.substring(0, 200),
    address: address || "אריאל",
    city: "אריאל",
    neighborhood: neighborhood || null,
    price: price || 0,
    rooms: details.rooms || null,
    size_sqm: details.sqm || null,
    floor: details.floor || null,
    property_type,
    status: statusVal,
    description: description.substring(0, 2000) || null,
    photos: photos.slice(0, 10),
  };
}

async function main() {
  console.log("=== Spectra Nadlan Listing Importer ===\n");

  // 1. Collect all property URLs
  console.log("Step 1: Collecting property URLs...");
  const urls = await collectPropertyUrls();
  console.log(`Found ${urls.length} property URLs\n`);

  // 2. Scrape each listing
  console.log("Step 2: Scraping listings...");
  const listings = [];
  for (const url of urls) {
    try {
      console.log(`  Scraping: ${decodeURIComponent(url).split("/").at(-2)}`);
      const listing = await scrapeListing(url);
      if (listing.price > 0 || listing.title) {
        listings.push(listing);
        console.log(`    ✓ ${listing.title.substring(0, 60)} | ₪${listing.price?.toLocaleString()} | ${listing.rooms} חד | ${listing.size_sqm}מ"ר`);
      }
      await new Promise(r => setTimeout(r, 500)); // polite delay
    } catch (e) {
      console.error(`  ✗ Failed ${url}: ${e.message}`);
    }
  }

  console.log(`\nScraped ${listings.length} listings\n`);

  // 3. Clear fake/demo data from Supabase
  console.log("Step 3: Clearing fake listings from Supabase...");
  const { error: delErr, count } = await supabase
    .from("listings")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all

  if (delErr) {
    console.error("Delete error:", delErr.message);
    // Try alternative - RLS may block deleting all, so delete by agent_id pattern
    const { error: delErr2 } = await supabase.from("listings").delete().gte("created_at", "2000-01-01");
    if (delErr2) console.error("Delete error 2:", delErr2.message);
    else console.log("Cleared existing listings ✓");
  } else {
    console.log(`Deleted ${count ?? "all"} existing listings ✓\n`);
  }

  // 4. Insert real listings
  console.log("Step 4: Inserting real listings into Supabase...");

  // Need agent_id — use a system/demo agent or the first agent
  const { data: agents } = await supabase.from("agents").select("id").limit(1);
  const agent_id = agents?.[0]?.id;

  if (!agent_id) {
    console.log("No agent found in DB — inserting without agent_id (public listings)");
  } else {
    console.log(`Using agent_id: ${agent_id}`);
  }

  let inserted = 0;
  for (const listing of listings) {
    const row = { ...listing };
    if (agent_id) row.agent_id = agent_id;

    const { error } = await supabase.from("listings").insert(row);
    if (error) {
      console.error(`  ✗ Insert failed for "${listing.title.substring(0,40)}": ${error.message}`);
    } else {
      inserted++;
      console.log(`  ✓ Inserted: ${listing.title.substring(0, 60)}`);
    }
  }

  console.log(`\n=== Done! Inserted ${inserted}/${listings.length} listings ===`);
}

main().catch(console.error);
