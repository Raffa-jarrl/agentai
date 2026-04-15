import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Called by Vercel Cron every Sunday 08:00 Asia/Jerusalem.
 * Authorization: Bearer ${CRON_SECRET}
 * Iterates all agents and materializes their weekly_report row for the previous full week.
 */

function weekBounds(now = new Date()) {
  // "This week" = Sunday 00:00 local → now. Report "last week" for freshly closed data.
  const d = new Date(now);
  const day = d.getDay(); // Sunday = 0
  const thisSunday = new Date(d); thisSunday.setHours(0, 0, 0, 0); thisSunday.setDate(d.getDate() - day);
  const lastSunday = new Date(thisSunday); lastSunday.setDate(thisSunday.getDate() - 7);
  const lastSaturdayEnd = new Date(thisSunday);
  return { weekStart: lastSunday, weekEnd: lastSaturdayEnd };
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();
  const { weekStart, weekEnd } = weekBounds();

  const { data: agents } = await svc.from("agents").select("id");
  let written = 0;

  for (const a of agents ?? []) {
    const agentId = a.id as string;
    const [{ count: leads_qualified }, { count: viewings_booked }, { count: content_posts_generated }, { data: convos }, { data: activeLeads }] = await Promise.all([
      svc.from("leads").select("id", { count: "exact", head: true }).eq("agent_id", agentId).eq("status", "qualified").gte("updated_at", weekStart.toISOString()).lt("updated_at", weekEnd.toISOString()),
      svc.from("viewings").select("id", { count: "exact", head: true }).eq("agent_id", agentId).gte("scheduled_at", weekStart.toISOString()).lt("scheduled_at", weekEnd.toISOString()),
      svc.from("content_posts").select("id", { count: "exact", head: true }).eq("agent_id", agentId).gte("created_at", weekStart.toISOString()).lt("created_at", weekEnd.toISOString()),
      svc.from("conversations").select("messages").eq("agent_id", agentId).gte("updated_at", weekStart.toISOString()).lt("updated_at", weekEnd.toISOString()),
      svc.from("leads").select("score, potential_commission").eq("agent_id", agentId).not("status", "in", '("closed_lost","inactive")'),
    ]);

    const messages_handled = (convos ?? []).reduce((sum, c) => sum + (Array.isArray(c.messages) ? c.messages.length : 0), 0);
    const hours_saved = Number(((messages_handled * 2 + (content_posts_generated ?? 0) * 15 + (viewings_booked ?? 0) * 10) / 60).toFixed(2));

    const hot = (activeLeads ?? []).filter((l) => l.score === "hot").length;
    const warm = (activeLeads ?? []).filter((l) => l.score === "warm").length;
    const cold = (activeLeads ?? []).filter((l) => l.score === "cold").length;
    const pipeline_value = (activeLeads ?? []).reduce((s, l) => s + (l.potential_commission ?? 0), 0);

    const highlights = [
      messages_handled > 0 && `השבוע טיפלת ב-${messages_handled} הודעות`,
      (leads_qualified ?? 0) > 0 && `סיננו ${leads_qualified} לידים חמים`,
      (viewings_booked ?? 0) > 0 && `נקבעו ${viewings_booked} צפיות`,
      hours_saved > 0 && `חסכנו לך כ-${hours_saved} שעות`,
    ].filter(Boolean) as string[];

    const { error } = await svc.from("weekly_reports").upsert(
      {
        agent_id: agentId,
        week_start: weekStart.toISOString().slice(0, 10),
        week_end: weekEnd.toISOString().slice(0, 10),
        messages_handled,
        leads_qualified: leads_qualified ?? 0,
        viewings_booked: viewings_booked ?? 0,
        hours_saved,
        pipeline_value,
        hot_leads_count: hot,
        warm_leads_count: warm,
        cold_leads_count: cold,
        response_time_avg_minutes: 0,
        content_posts_generated: content_posts_generated ?? 0,
        highlights,
      },
      { onConflict: "agent_id,week_start" },
    );
    if (!error) written += 1;
  }

  return NextResponse.json({ written });
}
