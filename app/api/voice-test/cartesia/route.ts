import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Generates an audio clip using Cartesia sonic-3. Used by /settings/voice-test
// to compare against the current ElevenLabs voice.
//
// Cartesia sonic-3 supports Hebrew. Voice ID can be overridden by the client
// so you can try several Cartesia voices without redeploy.

const DEFAULT_VOICE_ID = "84b969ad-19c7-428d-b742-48d387f7f138";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CARTESIA_API_KEY לא מוגדר. הוסף אותו ל-.env.local ול-Vercel env." },
      { status: 500 },
    );
  }

  const { text, voiceId, speed } = (await req.json()) as {
    text?: string;
    voiceId?: string;
    speed?: number;
  };
  if (!text?.trim()) return NextResponse.json({ error: "חסר טקסט" }, { status: 400 });

  const res = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "Cartesia-Version": "2026-03-01",
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: "sonic-3",
      transcript: text,
      voice: { mode: "id", id: voiceId || DEFAULT_VOICE_ID },
      output_format: {
        container: "wav",
        encoding: "pcm_s16le",
        sample_rate: 44100,
      },
      generation_config: {
        speed: typeof speed === "number" ? speed : 1,
        volume: 1,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: `Cartesia ${res.status}: ${detail}` }, { status: 502 });
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return new NextResponse(buf, {
    headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" },
  });
}
