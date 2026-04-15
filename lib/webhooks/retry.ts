/**
 * Webhook retry queue + dead-letter handling.
 * Tracks attempts, implements exponential backoff, routes to DLQ after 5 failures.
 */

import { createServiceClient } from "@/lib/supabase/server";

const RETRY_SCHEDULE = [
  1, // 1 min
  5, // 5 min
  30, // 30 min
  120, // 2 hr
  1440, // 24 hr
];

const MAX_ATTEMPTS = RETRY_SCHEDULE.length;

export interface WebhookPayload {
  type: "whatsapp" | "facebook_lead" | "yad2";
  agent_id: string;
  data: Record<string, unknown>;
}

/** Enqueue a webhook for processing with retries */
export async function enqueueWebhook(payload: WebhookPayload, idempotencyKey?: string) {
  const svc = createServiceClient();
  const { error } = await svc.from("webhook_attempts").insert({
    agent_id: payload.agent_id,
    webhook_type: payload.type,
    payload: payload.data,
    idempotency_key: idempotencyKey,
    status: "pending",
    next_retry_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Mark webhook as succeeded */
export async function markWebhookSuccess(webhookId: string) {
  const svc = createServiceClient();
  const { error } = await svc.from("webhook_attempts").update({ status: "success", processed_at: new Date().toISOString() }).eq("id", webhookId);
  if (error) throw error;
}

/** Retry a failed webhook, or move to DLQ if exhausted */
export async function retryWebhook(webhookId: string, lastError: string) {
  const svc = createServiceClient();
  const { data: webhook } = await svc.from("webhook_attempts").select("*").eq("id", webhookId).single();
  if (!webhook) return;

  const nextAttempt = (webhook.attempt_count ?? 0) + 1;
  if (nextAttempt >= MAX_ATTEMPTS) {
    // Move to dead-letter queue
    await svc.from("webhook_attempts").update({ status: "dead_letter", last_error: lastError, processed_at: new Date().toISOString() }).eq("id", webhookId);
    // TODO: Alert PagerDuty or Sentry
    console.error(`[DLQ] Webhook ${webhookId} exhausted retries: ${lastError}`);
    return;
  }

  const nextRetryMinutes = RETRY_SCHEDULE[nextAttempt] ?? 1440; // Default to 24hr if out of schedule
  const nextRetryAt = new Date(Date.now() + nextRetryMinutes * 60000);
  await svc
    .from("webhook_attempts")
    .update({ attempt_count: nextAttempt, status: "pending", last_error: lastError, next_retry_at: nextRetryAt.toISOString() })
    .eq("id", webhookId);
}

/** Fetch pending webhooks due for retry */
export async function fetchPendingWebhooks(limit = 100) {
  const svc = createServiceClient();
  const { data } = await svc
    .from("webhook_attempts")
    .select("*")
    .in("status", ["pending", "failed"])
    .lte("next_retry_at", new Date().toISOString())
    .order("created_at")
    .limit(limit);
  return data ?? [];
}
