"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Side-by-side Hebrew TTS comparison: ElevenLabs Hope (production voice) vs
// Cartesia sonic-3. Picks a winner for the Spectra agent.

const SAMPLES = [
  {
    label: "פתיחה + נכס לדוגמה (המקרה הכי חשוב)",
    text: "שלום וברוכים הבאים לספקטרה נדל״ן. נכס ראשון, רחוב אלון הגליל חמש, ארבעה וחצי חדרים, מאה ועשרים מטר, קומה שלישית, מיליון וארבע מאות אלף שקל. להוסיף לרשימת הוואטסאפ?",
  },
  {
    label: "שאלות רכות עם אינטונציה עולה",
    text: "אתם מחפשים לרכוש או לשכור? כמה חדרים אתם מעוניינים? יש אזור מועדף באריאל?",
  },
  {
    label: "מספרים ומחירים מורכבים",
    text: "מיליון ושמונה מאות אלף שקל. שישה וחצי חדרים, מאה ותשעים מטר. קומה שישית מתוך שבע. שלושת אלפים וחמש מאות שקל שכר דירה.",
  },
  {
    label: "שמות שכונות ואותיות",
    text: "רובע אלף, רובע בית, רובע גימל, רובע דלת. שכונת מוריה ושכונת נווה שאנן.",
  },
];

async function playAudioFromResponse(res: Response, audioRef: HTMLAudioElement | null) {
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  if (audioRef) {
    audioRef.src = url;
    await audioRef.play();
  }
}

export default function VoiceTestPage() {
  const [text, setText] = useState(SAMPLES[0]!.text);
  const [loadingEl, setLoadingEl] = useState(false);
  const [loadingCa, setLoadingCa] = useState(false);
  const [cartesiaVoiceId, setCartesiaVoiceId] = useState("");
  const [cartesiaSpeed, setCartesiaSpeed] = useState("1");
  const [latencyEl, setLatencyEl] = useState<number | null>(null);
  const [latencyCa, setLatencyCa] = useState<number | null>(null);
  const elAudio = useRef<HTMLAudioElement>(null);
  const caAudio = useRef<HTMLAudioElement>(null);

  async function playElevenLabs() {
    setLoadingEl(true);
    setLatencyEl(null);
    const start = performance.now();
    try {
      const r = await fetch("/api/voice-test/elevenlabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "שגיאה");
      }
      setLatencyEl(Math.round(performance.now() - start));
      await playAudioFromResponse(r, elAudio.current);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoadingEl(false);
    }
  }

  async function playCartesia() {
    setLoadingCa(true);
    setLatencyCa(null);
    const start = performance.now();
    try {
      const r = await fetch("/api/voice-test/cartesia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: cartesiaVoiceId || undefined,
          speed: Number(cartesiaSpeed) || 1,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "שגיאה");
      }
      setLatencyCa(Math.round(performance.now() - start));
      await playAudioFromResponse(r, caAudio.current);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoadingCa(false);
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">השוואת קולות — ElevenLabs מול Cartesia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          הקלידי טקסט עברית או בחרי דוגמה, לחצי על כל אחד מהכפתורים, והחליטי איזה קול נשמע טבעי יותר לסוכן.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>טקסט לבדיקה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir="rtl"
            rows={4}
            className="w-full border border-border rounded-md p-3 text-sm bg-background"
          />
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((s, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => setText(s.text)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>ElevenLabs Hope (הפרודקשן)</span>
              {latencyEl != null && <span className="text-xs text-muted-foreground">{latencyEl}ms</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Voice: zGjIP4SZlMnY9m93k97r · Model: eleven_v3 · Speed: 0.82 · Stability: 0.35
            </div>
            <Button onClick={playElevenLabs} disabled={loadingEl || !text.trim()}>
              {loadingEl ? "מייצרת..." : "נגן ElevenLabs"}
            </Button>
            <audio ref={elAudio} controls className="w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Cartesia sonic-3</span>
              {latencyCa != null && <span className="text-xs text-muted-foreground">{latencyCa}ms</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Voice ID (אופציונלי)</label>
                <Input
                  value={cartesiaVoiceId}
                  onChange={(e) => setCartesiaVoiceId(e.target.value)}
                  placeholder="84b969ad-19c7-428d-..."
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">מהירות (0.5-2.0)</label>
                <Input
                  value={cartesiaSpeed}
                  onChange={(e) => setCartesiaSpeed(e.target.value)}
                  placeholder="1"
                  dir="ltr"
                />
              </div>
            </div>
            <Button onClick={playCartesia} disabled={loadingCa || !text.trim()}>
              {loadingCa ? "מייצרת..." : "נגן Cartesia"}
            </Button>
            <audio ref={caAudio} controls className="w-full" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>איך להחליט</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            בדקי את שני הקולות על 4 הדוגמאות למעלה. שימי לב ל:
          </p>
          <ul className="list-disc pr-5 space-y-1">
            <li><strong>הגייה של שקל</strong> — Cartesia בד״כ נכשלת על מילים עבריות עם ש+ק.</li>
            <li><strong>אינטונציה של שאלה</strong> — האם הקול עולה בסוף שאלה או נשמע שטוח?</li>
            <li><strong>שמות רחובות</strong> — שילוב מילה + מספר.</li>
            <li><strong>שמות שכונות עם אותיות</strong> — "רובע אלף" במקום "רובע A".</li>
            <li><strong>זמן תגובה (ms)</strong> — מופיע בפינה של כל כרטיס אחרי ההשמעה.</li>
          </ul>
          <p className="pt-2">
            ברגע שהחלטת — שלחי לי את השם של הזוכה ואני אחליף את הקונפיג של Vapi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
