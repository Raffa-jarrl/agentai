import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsApp } from "@/lib/whatsapp/sandbox";
import { normalizeIsraeliPhone } from "@/lib/formatters/phone";

/**
 * Meta Cloud API-shaped webhook. Sandbox version — accepts a simplified payload:
 * { agent_id: string, from: string, body: string }  (real BSP decoder wraps this)
 * or Meta's payload { entry: [{ changes: [{ value: { messages: [...] } }] }] }
 */

// Meta webhook verification (kept for future real integration)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  // Sandbox shape
  const agentId = body.agent_id as string | undefined;
  const fromRaw = body.from as string | undefined;
  const text = body.body as string | undefined;
  const idempotencyKey = req.headers.get("idempotency-key") || req.headers.get("x-idempotency-key") || `${agentId}:${fromRaw}:${text}:${Date.now()}`;
  if (!agentId || !fromRaw || !text) return NextResponse.json({ error: "agent_id/from/body required" }, { status: 400 });

  const from = normalizeIsraeliPhone(fromRaw) ?? fromRaw;
  const svc = createServiceClient();

  // Idempotency: check if we've already processed this
  const { data: existing } = await svc
    .from("webhook_attempts")
    .select("id, status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing && existing.status === "success") return NextResponse.json({ ok: true, cached: true }, { status: 200 });

  // Queue webhook for async processing (return 202 immediately)
  const { error: enqueueError } = await svc.from("webhook_attempts").insert({
    agent_id: agentId,
    webhook_type: "whatsapp",
    payload: { from, body: text },
    idempotency_key: idempotencyKey,
    status: "pending",
    next_retry_at: new Date().toISOString(),
  });
  if (enqueueError) return NextResponse.json({ error: enqueueError.message }, { status: 500 });

  // Process inline (async fire-and-forget for Phase 1)
  // In Phase 2, delegate to Inngest job + return 202
  processWhatsAppWebhook(agentId, from, text, svc, idempotencyKey).catch((e) => {
    console.error("Webhook processing failed:", e);
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}

async function processWhatsAppWebhook(agentId: string, from: string, text: string, svc: ReturnType<typeof createServiceClient>, idempotencyKey: string) {
  try {
    // Find or create lead for this phone (scoped to agent)
    let { data: lead } = await svc.from("leads").select("id").eq("agent_id", agentId).eq("phone", from).maybeSingle();
    if (!lead) {
      const { data: created, error } = await svc
        .from("leads")
        .insert({ agent_id: agentId, full_name: "ליד חדש", phone: from, source: "whatsapp", status: "new" })
        .select("id")
        .single();
      if (error) throw error;
      lead = created;
    }

    // Append inbound message
    const now = new Date().toISOString();
    const entry = { role: "user", content: text, timestamp: now, type: "text" };
    const { data: convo } = await svc
      .from("conversations")
      .select("id, messages")
      .eq("lead_id", lead.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (convo) {
      const merged = [...((convo.messages as unknown[] | null) ?? []), entry];
      await svc.from("conversations").update({ messages: merged }).eq("id", convo.id);
    } else {
      await svc.from("conversations").insert({ agent_id: agentId, lead_id: lead.id, messages: [entry] });
    }

    await svc.from("leads").update({ last_contact_at: now }).eq("id", lead.id);

    // Kick off qualification
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const qualifyRes = await fetch(new URL("/api/ai/qualify-lead", origin), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lead_id: lead.id, agent_id: agentId }),
    });
    const qualifyData = await qualifyRes.json();
    const reply = qualifyData.complete
      ? "תודה! העברתי את הפרטים לסוכן שיחזור אלייך עם התאמות."
      : qualifyData.next_message || "תודה, מיד אשוב אלייך.";
    await sendWhatsApp({ to: from, body: reply }, agentId, lead.id);

    // Mark webhook as success
    await svc.from("webhook_attempts").update({ status: "success", processed_at: now }).eq("idempotency_key", idempotencyKey);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // Retry logic handled by background job later
    await svc
      .from("webhook_attempts")
      .update({ status: "failed", last_error: msg, attempt_count: (svc as any).attempt_count + 1 })
      .eq("idempotency_key", idempotencyKey);
    throw error;
  }
}
