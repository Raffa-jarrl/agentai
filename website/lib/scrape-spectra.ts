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

async function collectUrls(): Promise<string[]> {
  const urls = new Set<string>();
  for (const cat of CATALOG_URLS) {
    try {
      const html = await fetchPage(cat);
      const $ = cheerio.load(html);
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href") || "";
        if (href.includes("/נכס/") || href.includes("/%D7%A0%D7%9B%D7%A1/") || href.includes("/%d7%a0%d7%9b%d7%a1/")) {
          urls.add(href.split("?")[0]);
        }
      });
    } catch { /* skip */ }
  }
  return [...urls];
}

async function scrapeOne(url: string): Promise<LiveListing | null> {
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const title = ($("h1").first().text() || $("title").text().split(" - ")[0]).trim();
    const body = $("body").text();

    const priceM = body.match(/₪([\d,]+)/);
    const price = priceM ? parseInt(priceM[1].replace(/,/g, "")) : 0;

    const sqmM = body.match(/שטח בנוי\s*\n?\s*(\d{2,4})\s*מ/) || body.match(/(\d{2,4})\s*מ״ר/);
    const floorM = body.match(/קומה\s*\n?\s*(\d{1,2})/);
    const roomsM = body.match(/(\d{1,2}(?:\.\d)?)\s*חד/) || title.match(/(\d+)\s*חד/);
    const typeM = body.match(/סוג נכס\s*\n?\s*([^\n]{2,20})/);

    const listing_type: "rent" | "sale" =
      url.includes("להשכרה") || url.includes("%d7%9c%d7%94%d7%a9%d7%9b%d7%a8%d7%94") ? "rent" : "sale";

    const addrM = title.match(/^(.+?),\s*אריאל/);
    const address = addrM ? addrM[1].trim() : "אריאל";

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
      rooms: roomsM ? parseFloat(roomsM[1]) : null,
      size_sqm: sqmM ? parseInt(sqmM[1]) : null,
      floor: floorM ? parseInt(floorM[1]) : null,
      property_type: mapType(typeM?.[1] || title),
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
