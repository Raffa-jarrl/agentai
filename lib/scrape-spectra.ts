/**
 * Scrapes all live listings from spectra-nadlan.co.il.
 * Used by /api/listings-live with 1-hour cache — no DB required.
 * Source of truth = the live website.
 */
import * as cheerio from "cheerio";

const BASE = "https://www.spectra-nadlan.co.il";

export interface LiveListing {
  url: string;
  title: string;
  address: string;
  city: string;
  neighborhood: string | null;
  price: number;
  rooms: number | null;
  size_sqm: number | null;
  floor: number | null;
  property_type: string;
  listing_type: "rent" | "sale";
  description: string | null;
  photos: string[];
}

const CATALOG_URLS = [
  `${BASE}/%d7%a7%d7%98%d7%9c%d7%95%d7%92-%d7%94%d7%a0%d7%9b%d7%a1%d7%99%d7%9d/`,
  `${BASE}/%d7%a7%d7%98%d7%9c%d7%95%d7%92-%d7%94%d7%a0%d7%9b%d7%a1%d7%99%d7%9d/%d7%93%d7%99%d7%a8%d7%95%d7%aa-%d7%9c%d7%9e%d7%9b%d7%99%d7%a8%d7%94-%d7%91%d7%90%d7%a8%d7%99%d7%90%d7%9c/`,
  `${BASE}/%d7%a7%d7%98%d7%9c%d7%95%d7%92-%d7%94%d7%a0%d7%9b%d7%a1%d7%99%d7%9d/%d7%91%d7%aa%d7%99%d7%9d-%d7%9c%d7%9e%d7%9b%d7%99%d7%a8%d7%94-%d7%91%d7%90%d7%a8%d7%99%d7%90%d7%9c/`,
  `${BASE}/%d7%a7%d7%98%d7%9c%d7%95%d7%92-%d7%94%d7%a0%d7%9b%d7%a1%d7%99%d7%9d/%d7%93%d7%99%d7%a8%d7%95%d7%aa-%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94-%d7%91%d7%90%d7%a8%d7%99%d7%90%d7%9c/`,
  `${BASE}/%d7%a7%d7%98%d7%9c%d7%95%d7%92-%d7%94%d7%a0%d7%9b%d7%a1%d7%99%d7%9d/%d7%a0%d7%93%d7%9c%d7%9f-%d7%9e%d7%a1%d7%97%d7%a8%d7%99-%d7%91%d7%90%d7%a8%d7%99%d7%90%d7%9c-%d7%9e%d7%a9%d7%a8%d7%93%d7%99%d7%9d-%d7%97%d7%a0%d7%95%d7%99%d7%95%d7%aa-%d7%95%d7%aa%d7%a2%d7%a9/`,
];

const TYPE_MAP: Record<string, string> = {
  "דירה": "apartment", "בית": "house", "בית פרטי": "house", "וילה": "house",
  "דו משפחתי": "house", "צמוד קרקע": "house", "קוטג": "house",
  "דירת גן": "garden_apt", "דופלקס": "duplex", "פנטהאוז": "penthouse", "גג": "penthouse",
  "מסחרי": "commercial", "משרד": "commercial", "חנות": "commercial",
  "קרקע": "land", "מגרש": "land",
};

const NEIGHBORHOODS = ["מוריה", "נווה שאנן", "רובע א", "רובע ב", "רובע ג", "רובע ד", "יפה נוף", "השרון"];

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SpectraAI/1.0)" },
    next: { revalidate: 3600 },
  });
  return res.text();
}

function mapType(he: string): string {
  for (const [k, v] of Object.entries(TYPE_MAP)) if (he.includes(k)) return v;
  return "apartment";
}

function extractNeighborhood(text: string): string | null {
  for (const n of NEIGHBORHOODS) if (text.includes(n)) return n;
  return null;
}

// Property-status archives paginate properly (unlike the catalog page which
// is rendered client-side with AJAX load-more). /page/1/ redirects, so we
// start at the bare URL then continue /page/2/, /page/3/... until a 404.
const STATUS_ARCHIVES = [
  `${BASE}/%D7%A1%D7%98%D7%98%D7%95%D7%A1-%D7%A0%D7%9B%D7%A1/%D7%9C%D7%9E%D7%9B%D7%99%D7%A8%D7%94/`, // למכירה
  `${BASE}/%D7%A1%D7%98%D7%98%D7%95%D7%A1-%D7%A0%D7%9B%D7%A1/%D7%9C%D7%94%D7%A9%D7%9B%D7%A8%D7%94/`, // להשכרה
];

function extractPropertyHrefs(html: string, sink: Set<string>) {
  const $ = cheerio.load(html);
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.includes("/נכס/") || href.includes("/%D7%A0%D7%9B%D7%A1/") || href.includes("/%d7%a0%d7%9b%d7%a1/")) {
      const clean = (href.split("?")[0] ?? "").replace(/\/$/, "/");
      // Skip the bare /נכס/ archive root
      if (clean && !clean.match(/\/(נכס|%D7%A0%D7%9B%D7%A1|%d7%a0%d7%9b%d7%a1)\/?$/i)) {
        sink.add(clean);
      }
    }
  });
}

async function fetchPageWithStatus(url: string): Promise<{ html: string; ok: boolean }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SpectraAI/1.0)" },
      next: { revalidate: 3600 },
      redirect: "follow",
    });
    return { html: await res.text(), ok: res.ok };
  } catch {
    return { html: "", ok: false };
  }
}

async function collectUrls(): Promise<string[]> {
  const urls = new Set<string>();

  // Source 1: property-status archives with pagination (primary — this is the
  // only place Spectra's Houzez install exposes the full list server-side)
  for (const archive of STATUS_ARCHIVES) {
    // First page at the bare URL
    const first = await fetchPageWithStatus(archive);
    if (first.ok) extractPropertyHrefs(first.html, urls);
    // Then paginate. Houzez serves /page/N/ until 404.
    for (let p = 2; p <= 20; p++) {
      const res = await fetchPageWithStatus(`${archive}page/${p}/`);
      if (!res.ok) break;
      const before = urls.size;
      extractPropertyHrefs(res.html, urls);
      // If a page adds zero new URLs twice in a row, stop (defensive)
      if (urls.size === before && p > 3) break;
    }
  }

  // Source 2: Houzez property sitemap (catches anything not in archives)
  try {
    const xml = await fetchPage(`${BASE}/property-sitemap.xml`);
    const matches = xml.match(/<loc>[^<]+<\/loc>/g) ?? [];
    for (const m of matches) {
      const u = m.replace(/<\/?loc>/g, "").trim();
      if (u.match(/\/(נכס|%D7%A0%D7%9B%D7%A1|%d7%a0%d7%9b%d7%a1)\/[^/]+\/?$/i)) {
        urls.add(u.split("?")[0] ?? u);
      }
    }
  } catch { /* skip */ }

  // Source 3: catalog category pages (final fallback)
  for (const cat of CATALOG_URLS) {
    try {
      const html = await fetchPage(cat);
      extractPropertyHrefs(html, urls);
    } catch { /* skip */ }
  }

  return [...urls];
}

async function scrapeOne(url: string): Promise<LiveListing | null> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const title = ($("h1").first().text() || ($("title").text().split(" - ")[0] ?? "")).trim();
    const body = $("body").text();

    const priceM = body.match(/₪([\d,]+)/);
    const price = priceM?.[1] ? parseInt(priceM[1].replace(/,/g, "")) : 0;

    const sqmM = body.match(/שטח בנוי\s*\n?\s*(\d{2,4})\s*מ/) || body.match(/(\d{2,4})\s*מ״ר/);
    // Strict: "קומה" immediately followed by a small number, not 2+ lines away.
    // Previously matched "קומה ... (96 מ"ר)" — floor-96 bug.
    const floorM = body.match(/קומה[\s:]{0,5}(\d{1,2})(?!\d)/);
    const roomsM = body.match(/(\d{1,2}(?:\.\d)?)\s*חד/) || title.match(/(\d+)\s*חד/);
    const typeM = body.match(/סוג נכס\s*\n?\s*([^\n]{2,20})/);

    const listing_type: "rent" | "sale" =
      url.includes("להשכרה") || url.includes("%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94") ? "rent" : "sale";

    const addrM = title.match(/^(.+?),\s*אריאל/);
    const address = addrM?.[1] ? addrM[1].trim() : "אריאל";

    let description = "";
    $("p").each((_, el) => {
      const t = $(el).text().trim();
      if (t.length > description.length && t.length > 50 && !t.includes("תנאי שימוש")) description = t;
    });

    const photos: string[] = [];
    $("img[src*='uploads'], img[src*='spectra-nadlan']").each((_, el) => {
      const src = $(el).attr("src") || "";
      if (src.includes("uploads") && !src.includes("logo") && !src.includes("icon")) {
        const full = src.replace(/-\d+x\d+(\.\w+)$/, "$1");
        if (!photos.includes(full)) photos.push(full);
      }
    });

    return {
      url,
      title: title.substring(0, 200),
      address,
      city: "אריאל",
      neighborhood: extractNeighborhood(address) || extractNeighborhood(title),
      price,
      rooms: roomsM?.[1] ? parseFloat(roomsM[1]) : null,
      size_sqm: sqmM?.[1] ? parseInt(sqmM[1]) : null,
      // Sanity: Ariel has no buildings above ~15 floors. Drop impossible values.
      floor: floorM?.[1] && parseInt(floorM[1]) <= 20 ? parseInt(floorM[1]) : null,
      property_type: mapType(typeM?.[1] ?? title),
      listing_type,
      description: description.substring(0, 1000) || null,
      photos: photos.slice(0, 6),
    };
  } catch {
    return null;
  }
}

export async function fetchLiveListings(): Promise<LiveListing[]> {
  const urls = await collectUrls();
  const results = await Promise.all(urls.map(scrapeOne));
  return results.filter((l): l is LiveListing => l !== null && (l.price > 0 || !!l.title));
}
