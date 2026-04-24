/**
 * Green API WhatsApp sender. Popular Israeli service — lets Arik use his
 * personal WhatsApp without Meta BSP approval. Setup:
 *
 *   1. Sign up at https://green-api.com
 *   2. Create an instance, scan the QR code with Arik's WhatsApp
 *   3. Add to .env.local and Vercel env:
 *        GREEN_API_ID_INSTANCE=<number>
 *        GREEN_API_TOKEN=<token>
 *
 * Leave those unset to keep using the sandbox (logs only).
 */

import type { WhatsAppMessage, SendResult } from "./sandbox";

export function greenApiConfigured(): boolean {
  return !!(process.env.GREEN_API_ID_INSTANCE && process.env.GREEN_API_TOKEN);
}

// Converts +972501234567 → 972501234567@c.us (Green API's chat-ID format).
function toChatId(e164: string): string {
  const digits = e164.replace(/[^\d]/g, "");
  return `${digits}@c.us`;
}

export async function sendViaGreenApi(msg: WhatsAppMessage): Promise<SendResult> {
  const idInstance = process.env.GREEN_API_ID_INSTANCE!;
  const token = process.env.GREEN_API_TOKEN!;
  const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: toChatId(msg.to),
      message: msg.body,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Green API ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as { idMessage?: string };
  return {
    provider_message_id: data.idMessage ?? `green-${Date.now()}`,
    delivered_at: new Date().toISOString(),
    sandbox: false,
  };
}
