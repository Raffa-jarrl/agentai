import { createServiceClient } from "@/lib/supabase/server";

export async function createNotification(
  agentId: string,
  type: string,
  title: string,
  body: string,
  link?: string,
) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("notifications").insert({
    agent_id: agentId,
    type,
    title,
    body,
    link: link ?? null,
  });
  if (error) {
    console.error("[createNotification] error:", error.message);
  }
}
