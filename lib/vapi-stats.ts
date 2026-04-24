/**
 * Fetches call stats from Vapi API and aggregates them for the weekly
 * dashboard. Pulls the last 7 days of calls and breaks down cost by component.
 */

const VAPI_BASE = "https://api.vapi.ai";

interface VapiCall {
  id: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  costBreakdown?: {
    transport?: number;
    stt?: number;
    llm?: number;
    tts?: number;
    vapi?: number;
    total?: number;
  };
  // Vapi also exposes analysis of call length separately
}

export interface WeeklyStats {
  callCount: number;
  totalMinutes: number;
  totalCost: number;
  breakdown: {
    vapi: number;
    stt: number;
    llm: number;
    tts: number;
    transport: number;
  };
  avgMinutesPerCall: number;
  avgCostPerMinute: number;
  projectedMonthlyMinutes: number;
  projectedMonthlyCost: number;
  ttsCharsEstimate: number;
  recommendations: string[];
}

function minutesBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, ms / 60000);
}

export async function fetchWeeklyStats(assistantId: string): Promise<WeeklyStats> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) throw new Error("VAPI_API_KEY not set");

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const url = `${VAPI_BASE}/call?assistantId=${assistantId}&limit=100&createdAtGt=${encodeURIComponent(since)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 300 }, // 5-minute cache
  });
  if (!res.ok) throw new Error(`Vapi API ${res.status}`);
  const calls = (await res.json()) as VapiCall[];

  let totalMinutes = 0;
  let totalCost = 0;
  const breakdown = { vapi: 0, stt: 0, llm: 0, tts: 0, transport: 0 };

  for (const c of calls) {
    totalMinutes += minutesBetween(c.startedAt, c.endedAt);
    totalCost += c.cost ?? c.costBreakdown?.total ?? 0;
    if (c.costBreakdown) {
      breakdown.vapi += c.costBreakdown.vapi ?? 0;
      breakdown.stt += c.costBreakdown.stt ?? 0;
      breakdown.llm += c.costBreakdown.llm ?? 0;
      breakdown.tts += c.costBreakdown.tts ?? 0;
      breakdown.transport += c.costBreakdown.transport ?? 0;
    }
  }

  const avgMinutesPerCall = calls.length ? totalMinutes / calls.length : 0;
  const avgCostPerMinute = totalMinutes ? totalCost / totalMinutes : 0;
  const projectedMonthlyMinutes = totalMinutes * (30 / 7);
  const projectedMonthlyCost = totalCost * (30 / 7);

  // Rough estimate: ElevenLabs v3 Hebrew ~600 chars/min assistant speech,
  // assistant speaks ~50% of the call → 300 chars/min billable.
  const ttsCharsEstimate = Math.round(projectedMonthlyMinutes * 300);

  const recommendations: string[] = [];
  // ElevenLabs Creator plan = 121k credits/mo. Pro = 500k.
  if (ttsCharsEstimate > 100_000 && ttsCharsEstimate <= 400_000) {
    recommendations.push(
      `הצפי החודשי הוא ${ttsCharsEstimate.toLocaleString("he-IL")} תווים ב-ElevenLabs. התוכנית Creator (121 אלף תווים) עלולה לא להספיק — שקול שדרוג ל-Pro ($99/חודש, 500 אלף תווים).`
    );
  } else if (ttsCharsEstimate > 400_000) {
    recommendations.push(
      `שימוש כבד ב-ElevenLabs (${ttsCharsEstimate.toLocaleString("he-IL")} תווים). מומלץ Pro+ או Scale.`
    );
  }
  if (projectedMonthlyMinutes > 2000) {
    recommendations.push(
      `צפי של ${Math.round(projectedMonthlyMinutes)} דקות בחודש — Vapi מציעים הנחות נפח מעל 2000 דקות. יש לפנות למכירות שלהם.`
    );
  }
  if (avgMinutesPerCall > 5) {
    recommendations.push(
      `שיחות ארוכות מהממוצע (${avgMinutesPerCall.toFixed(1)} דקות). שקול לקצר את התסריט או להעביר מוקדם לאריק.`
    );
  }
  if (recommendations.length === 0) {
    recommendations.push("כל התוכניות מתאימות לנפח הנוכחי. אין צורך בשדרוג.");
  }

  return {
    callCount: calls.length,
    totalMinutes,
    totalCost,
    breakdown,
    avgMinutesPerCall,
    avgCostPerMinute,
    projectedMonthlyMinutes,
    projectedMonthlyCost,
    ttsCharsEstimate,
    recommendations,
  };
}
