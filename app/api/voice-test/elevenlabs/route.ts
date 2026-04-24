import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Generates an audio clip using ElevenLabs with the same voice Vapi uses
// for the production agent (Hope — zGjIP4SZlMnY9m93k97r, eleven_v3).
// Used by /settings/voice-test to compare against Cartesia.

const VOICE_ID = "zGjIP4SZlMnY9m93k97r";
const MODEL_ID = "eleven_v3";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY לא מוגדר. הוסף אותו ל-.env.local ול-Vercel env." },
      { status: 500 },
    );
  }

  const { text } = (await req.json()) as { text?: string };
  if (!text?.trim()) return NextResponse.json({ error: "חסר טקסט" }, { status: 400 });

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.75,
          style: 0.45,
          use_speaker_boost: true,
          speed: 0.82,
        },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: `ElevenLabs ${res.status}: ${detail}` }, { status: 502 });
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return new NextResponse(buf, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
