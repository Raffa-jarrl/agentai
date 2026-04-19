/**
 * Hebrew pronunciation dictionary for the Spectra voice agent.
 *
 * Azure HilaNeural TTS mispronounces certain Hebrew abbreviations and letter
 * names. This module rewrites text BEFORE it's handed to TTS so the agent
 * sounds natural over the phone.
 *
 * Two mechanisms:
 *   1. PATTERNS – regex substitutions (e.g. "רובע א" → "רובע אלף")
 *   2. DICTIONARY – exact phrase replacements for known street names
 */

// --- Hebrew letter → ordinal (for רובע א/ב/ג/ד) ---
// Using ordinal numbers (first/second/third/fourth) avoids TTS homophone
// problems: "אלף" is read as "one thousand", "בית" as "house", "דלת" as
// "door". Ordinals are unambiguous and how Israelis often say it.
const HEBREW_LETTER_NAMES: Record<string, string> = {
  "א": "אָלֶף",
  "ב": "בֵּית",
  "ג": "גִּימֶל",
  "ד": "דָּלֶת",
  "ה": "הֵא",
  "ו": "וָו",
  "ז": "זַיִן",
  "ח": "חֵית",
  "ט": "טֵית",
  "י": "יוֹד",
};

// --- Numbers 1-30 in Hebrew (masculine, as used for addresses) ---
const NUMBER_WORDS: Record<number, string> = {
  1: "אחד", 2: "שניים", 3: "שלושה", 4: "ארבעה", 5: "חמישה",
  6: "שישה", 7: "שבעה", 8: "שמונה", 9: "תשעה", 10: "עשרה",
  11: "אחד עשר", 12: "שנים עשר", 13: "שלושה עשר", 14: "ארבעה עשר",
  15: "חמישה עשר", 16: "שישה עשר", 17: "שבעה עשר", 18: "שמונה עשרה",
  19: "תשעה עשר", 20: "עשרים", 21: "עשרים ואחד", 22: "עשרים ושניים",
  23: "עשרים ושלושה", 24: "עשרים וארבעה", 25: "עשרים וחמישה",
  26: "עשרים ושישה", 27: "עשרים ושבעה", 28: "עשרים ושמונה",
  29: "עשרים ותשעה", 30: "שלושים",
};

// --- Exact phrase substitutions (override patterns) ---
// Add entries here as we discover TTS mispronunciations.
const PHRASE_DICTIONARY: Record<string, string> = {
  // Rova with geresh variants → vowelized letter-name form
  "רובע א׳": "רובע אָלֶף",
  "רובע ב׳": "רובע בֵּית",
  "רובע ג׳": "רובע גִּימֶל",
  "רובע ד׳": "רובע דָּלֶת",
  "רובע א'": "רובע אָלֶף",
  "רובע ב'": "רובע בֵּית",
  "רובע ג'": "רובע גִּימֶל",
  "רובע ד'": "רובע דָּלֶת",

  // Common abbreviations in listings
  "רח׳": "רחוב",
  "רח'": "רחוב",
  'מ"ר': "מטר רבוע",
  "מ״ר": "מטר רבוע",
  "ח׳": "חדרים",
  "ח'": "חדרים",
  "יח׳": "יחידת",
  'ממ"ד': "ממד",
  "ממ״ד": "ממד",

  // Fractions
  "3.5": "שלוש וחצי",
  "4.5": "ארבע וחצי",
  "2.5": "שתיים וחצי",
  "1.5": "אחד וחצי",
  "5.5": "חמש וחצי",
};

// Expand a number (1–30) to its Hebrew word form, or keep digits for larger.
function numberToHebrewWord(n: number): string {
  if (n >= 1 && n <= 30) return NUMBER_WORDS[n] ?? String(n);
  return String(n);
}

/**
 * Main entry point: rewrite a string to be TTS-friendly Hebrew.
 * Optional `extra` map merges DB-managed entries on top of hardcoded defaults.
 */
export function applyPronunciations(text: string, extra?: Record<string, string>): string {
  if (!text) return text;
  let out = text;

  const merged: Record<string, string> = { ...PHRASE_DICTIONARY, ...(extra ?? {}) };

  // 1. Phrase dictionary (longest-first to avoid partial overlaps)
  const phrases = Object.keys(merged).sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    out = out.split(phrase).join(merged[phrase]!);
  }

  // 2. "רובע X" where X is a bare Hebrew letter → expand to letter name
  out = out.replace(/רובע\s+([א-י])(?=\s|$|[,.])/g, (_m, letter: string) => {
    const name = HEBREW_LETTER_NAMES[letter] ?? letter;
    return `רובע ${name}`;
  });

  // 3. Street numbers: "מוריה 18" → "מוריה שמונה עשרה"
  // Match: Hebrew word + space + 1-30 (standalone, not part of larger number)
  out = out.replace(/([\u0590-\u05FF]+)\s+(\d{1,2})(?!\d)/g, (m, word: string, numStr: string) => {
    const n = parseInt(numStr, 10);
    if (n >= 1 && n <= 30) return `${word} ${numberToHebrewWord(n)}`;
    return m;
  });

  return out;
}

// --- DB-managed entries (loaded at runtime, cached 60s) ---
let dbCache: { at: number; map: Record<string, string> } | null = null;
const DB_CACHE_TTL_MS = 60_000;

export async function loadDbPronunciations(): Promise<Record<string, string>> {
  if (dbCache && Date.now() - dbCache.at < DB_CACHE_TTL_MS) return dbCache.map;
  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const svc = createServiceClient();
    const { data, error } = await svc
      .from("pronunciations")
      .select("original_text,phonetic_text");
    if (error || !data) {
      dbCache = { at: Date.now(), map: {} };
      return {};
    }
    const map: Record<string, string> = {};
    for (const row of data as Array<{ original_text: string; phonetic_text: string }>) {
      map[row.original_text] = row.phonetic_text;
    }
    dbCache = { at: Date.now(), map };
    return map;
  } catch {
    return {};
  }
}

export async function applyPronunciationsWithDb(text: string): Promise<string> {
  const extra = await loadDbPronunciations();
  return applyPronunciations(text, extra);
}
