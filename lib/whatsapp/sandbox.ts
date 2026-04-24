/**
 * WhatsApp sender. Routes to a real provider (Green API) when credentials are
 * set, otherwise falls back to the sandbox (logs + stores in conversations).
 * Real BSP integration (Meta Cloud API or 360dialog/Twilio) swaps in behind
 * the same interface.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { greenApiConfigured, sendViaGreenApi } from "./green-api";

export interface WhatsAppMessage {
  to: string; // E.164
  body: string;
  type?: "text" | "image" | "template";
}

export interface SendResult {
  provider_message_id: string;
  delivered_at: string;
  sandbox: boolean;
}

export async function sendWhatsApp(msg: WhatsAppMessage, agentId: string, leadId?: string): Promise<SendResult> {
  let result: SendResult;

  if (greenApiConfigured()) {
    try {
      result = await sendViaGreenApi(msg);
      // eslint-disable-next-line no-console
      console.log("[WhatsApp green-api] →", { agentId, leadId, to: msg.to, id: result.provider_message_id });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[WhatsApp green-api] failed, falling back to sandbox:", err);
      result = {
        provider_message_id: `sandbox-fallback-${Date.now()}`,
        delivered_at: new Date().toISOString(),
        sandbox: true,
      };
    }
  } else {
    result = {
      provider_message_id: `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      delivered_at: new Date().toISOString(),
      sandbox: true,
    };
    // eslint-disable-next-line no-console
    console.log("[WhatsApp sandbox] →", { agentId, leadId, ...msg, id: result.provider_message_id });
  }

  const id = result.provider_message_id;
  const when = result.delivered_at;

  if (leadId) {
    const svc = createServiceClient();
    // Append to the latest conversation, or create one
    const { data: convo } = await svc
      .from("conversations")
      .select("id, messages")
      .eq("lead_id", leadId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const entry = { role: "assistant", content: msg.body, timestamp: when, type: msg.type ?? "text" };

    if (convo) {
      const merged = [...((convo.messages as unknown[] | null) ?? []), entry];
      await svc.from("conversations").update({ messages: merged, updated_at: when }).eq("id", convo.id);
    } else {
      await svc.from("conversations").insert({
        agent_id: agentId,
        lead_id: leadId,
        messages: [entry],
      });
    }

    await svc.from("leads").update({ last_contact_at: when }).eq("id", leadId);
  }

  return result;
}
