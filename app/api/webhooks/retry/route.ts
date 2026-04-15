/**
 * Background job: process pending webhooks with retries.
 * Called periodically (every 5 minutes via cron or Inngest).
 * Only processes up to 100 webhooks per call.
 *
 * Authorization: Bearer ${CRON_SECRET}
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { retryWebhook } from "@/lib/webhooks/retry";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();
  const { data: pending } = await svc
    .from("webhook_attempts")
    .select("*")
    .in("status", ["pending", "failed"])
    .lte("next_retry_at", new Date().toISOString())
    .order("created_at")
    .limit(100);

  let processed = 0;
  let failed = 0;

  for (const webhook of pending ?? []) {
    try {
      // Deserialize and process webhook based on type
      const payload = webhook.payload as Record<string, unknown>;
      if (webhook.webhook_type === "whatsapp") {
        const { from, body } = payload as { from: string; body: string };
        // Re-run qualification + message handling
        const res = await fetch(new URL("/api/ai/qualify-lead", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lead_id: webhook.payload?.lead_id, agent_id: webhook.agent_id }),
        });
        if (res.ok) {
          await svc.from("webhook_attempts").update({ status: "success", processed_at: new Date().toISOString() }).eq("id", webhook.id);
          processed += 1;
        } else {
          throw new Error(await res.text());
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await retryWebhook(webhook.id, msg);
      failed += 1;
    }
  }

  return NextResponse.json({ processed, failed, total: pending?.length ?? 0 });
}
