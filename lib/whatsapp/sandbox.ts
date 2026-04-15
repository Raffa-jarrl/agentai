/**
 * WhatsApp sandbox / mock layer.
 * Real BSP integration (Meta Cloud API or 360dialog/Twilio) swaps in behind the same interface.
 */

import { createServiceClient } from "@/lib/supabase/server";

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
  const id = `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const when = new Date().toISOString();

  // eslint-disable-next-line no-console
  console.log("[WhatsApp sandbox] →", { agentId, leadId, ...msg, id });

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

  return { provider_message_id: id, delivered_at: when, sandbox: true };
}
