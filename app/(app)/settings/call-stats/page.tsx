"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Stats {
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

function formatUSD(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function CallStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/call-stats");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "שגיאה");
      setStats(d);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">סטטיסטיקת שיחות — שבועי</h1>
          <p className="text-sm text-muted-foreground mt-1">
            נתוני 7 הימים האחרונים של סוכן הטלפון.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? "טוען..." : "רענן"}
        </Button>
      </div>

      {err && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600">שגיאה: {err}</CardContent>
        </Card>
      )}

      {stats && !loading && (
        <>
          {/* Top-level cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">שיחות השבוע</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{stats.callCount}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">דקות השבוע</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{stats.totalMinutes.toFixed(1)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">עלות השבוע</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{formatUSD(stats.totalCost)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">עלות לדקה (ממוצע)</CardTitle></CardHeader>
              <CardContent className="text-2xl font-bold">{formatUSD(stats.avgCostPerMinute)}</CardContent>
            </Card>
          </div>

          {/* Breakdown */}
          <Card>
            <CardHeader><CardTitle>פירוט עלויות — השבוע</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b"><td className="py-2">Vapi (פלטפורמה)</td><td className="text-left">{formatUSD(stats.breakdown.vapi)}</td></tr>
                  <tr className="border-b"><td className="py-2">Transport (Twilio)</td><td className="text-left">{formatUSD(stats.breakdown.transport)}</td></tr>
                  <tr className="border-b"><td className="py-2">STT (הבנה)</td><td className="text-left">{formatUSD(stats.breakdown.stt)}</td></tr>
                  <tr className="border-b"><td className="py-2">LLM (מוח)</td><td className="text-left">{formatUSD(stats.breakdown.llm)}</td></tr>
                  <tr className="border-b"><td className="py-2">TTS (קול — ElevenLabs)</td><td className="text-left">{formatUSD(stats.breakdown.tts)}</td></tr>
                  <tr className="font-bold"><td className="py-2">סה״כ</td><td className="text-left">{formatUSD(stats.totalCost)}</td></tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Monthly projection */}
          <Card>
            <CardHeader><CardTitle>תחזית חודשית</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>דקות צפויות בחודש</span><span className="font-medium">{stats.projectedMonthlyMinutes.toFixed(0)}</span></div>
              <div className="flex justify-between"><span>עלות צפויה בחודש</span><span className="font-medium">{formatUSD(stats.projectedMonthlyCost)}</span></div>
              <div className="flex justify-between"><span>תווים ב-ElevenLabs (הערכה)</span><span className="font-medium">{stats.ttsCharsEstimate.toLocaleString("he-IL")}</span></div>
              <div className="flex justify-between"><span>ממוצע דקות לשיחה</span><span className="font-medium">{stats.avgMinutesPerCall.toFixed(1)}</span></div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader><CardTitle>המלצות</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pr-5 space-y-2 text-sm">
                {stats.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
