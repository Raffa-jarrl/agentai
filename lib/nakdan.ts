/**
 * DICTA Nakdan — adds niqqud (Hebrew vowel marks) to plain text so Azure
 * HilaNeural TTS pronounces it correctly.
 *
 * API: https://nakdan-5-1.loadbalancer.dicta.org.il/api
 * Free, no auth. Response is an array of word tokens, each with an
 * "options" array ranked best-first. We take options[0] and reassemble.
 *
 * We cache by input string in-process since listings are fetched hourly
 * and the same lines get vowelized repeatedly.
 */

const NAKDAN_URL = "https://nakdan-5-1.loadbalancer.dicta.org.il/api";

interface NakdanToken {
  word: string;
  sep: boolean;
  options: string[];
  fconfident?: boolean;
}

const cache = new Map<string, { at: number; value: string }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function vowelizeHebrew(text: string): Promise<string> {
  if (!text?.trim()) return text;

  const cached = cache.get(text);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  try {
    const res = await fetch(NAKDAN_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task: "nakdan",
        data: text,
        genre: "modern",
        addmorph: false,
        keepmetagim: true,
        keepqq: false,
      }),
      // short timeout — don't hang up the call if Nakdan is slow
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return text;

    const tokens = (await res.json()) as NakdanToken[];
    let out = "";
    for (const t of tokens) {
      if (t.sep) {
        out += t.word;
        continue;
      }
      const best = t.options?.[0];
      // Nakdan may return "שֶׁ|לּוֹם" with a | separator between prefix+stem. Strip it.
      out += best ? best.replace(/\|/g, "") : t.word;
    }

    cache.set(text, { at: Date.now(), value: out });
    return out;
  } catch {
    // On any failure (timeout, 5xx, JSON parse), return original text
    // so the call still succeeds — pronunciation dictionary still applies.
    return text;
  }
}
