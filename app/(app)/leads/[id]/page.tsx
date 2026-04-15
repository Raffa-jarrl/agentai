import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { formatILS } from "@/lib/formatters/currency";
import { formatDateTime, timeAgo } from "@/lib/formatters/date";
import { formatIsraeliPhone } from "@/lib/formatters/phone";
import type { ConversationMessage } from "@/types/database";

const timelineLabels: Record<string, string> = {
  immediate: "מיידי",
  "1_3_months": "1–3 חודשים",
  "3_6_months": "3–6 חודשים",
  exploring: "בוחן",
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", params.id).maybeSingle();
  if (!lead) notFound();

  const [{ data: conversation }, { data: matches }, { data: viewings }] = await Promise.all([
    supabase.from("conversations").select("messages, summary").eq("lead_id", lead.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("lead_listing_matches").select("id, match_score, match_reasons, listing:listings(id, title, city, price)").eq("lead_id", lead.id).order("match_score", { ascending: false }),
    supabase.from("viewings").select("id, scheduled_at, status, listing:listings(id, title)").eq("lead_id", lead.id).order("scheduled_at", { ascending: false }),
  ]);

  const messages: ConversationMessage[] = (conversation?.messages as unknown as ConversationMessage[]) ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{lead.full_name}</h1>
            <ScoreBadge tier={lead.score} value={lead.score_value} />
            <Badge variant="secondary">{lead.status}</Badge>
          </div>
          <p className="text-muted-foreground ltr mt-1">{formatIsraeliPhone(lead.phone)}</p>
        </div>
        <Button variant="outline" asChild><Link href="/leads">חזרה</Link></Button>
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <Info label="תקציב">
          <span className="ltr">{lead.budget_min ? formatILS(lead.budget_min) : "—"} – {lead.budget_max ? formatILS(lead.budget_max) : "—"}</span>
        </Info>
        <Info label="חדרים מועדפים">{lead.preferred_rooms ?? "—"}</Info>
        <Info label="אזורים">{lead.preferred_areas?.join(", ") || "—"}</Info>
        <Info label="לוח זמנים">{lead.timeline ? timelineLabels[lead.timeline] : "—"}</Info>
        <Info label="משכנתא">{lead.mortgage_approved ? "אושר" : lead.mortgage_approved === false ? "לא" : "לא ידוע"}{lead.mortgage_amount ? ` · ${formatILS(lead.mortgage_amount)}` : ""}</Info>
        <Info label="עמלה פוטנציאלית"><span className="ltr">{formatILS(lead.potential_commission)}</span></Info>
        <Info label="קשר אחרון">{lead.last_contact_at ? timeAgo(lead.last_contact_at) : "—"}</Info>
        <Info label="מעקב הבא">{lead.next_followup_at ? formatDateTime(lead.next_followup_at) : "—"}</Info>
      </section>

      {lead.notes && (
        <section>
          <h2 className="font-semibold mb-2">הערות</h2>
          <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{lead.notes}</p>
        </section>
      )}

      <section>
        <h2 className="font-semibold mb-2">שיחות</h2>
        {!messages.length ? (
          <p className="text-sm text-muted-foreground">אין שיחות עדיין</p>
        ) : (
          <ul className="space-y-2">
            {messages.slice(-20).map((m, i) => (
              <li key={i} className={`p-3 rounded-md text-sm max-w-[80%] ${m.role === "assistant" || m.role === "agent" ? "bg-brand text-white mr-auto" : "bg-muted"}`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div className="text-[10px] opacity-70 mt-1">{formatDateTime(m.timestamp)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">התאמות ({matches?.length ?? 0})</h2>
        {!matches?.length ? <p className="text-sm text-muted-foreground">אין התאמות</p> : (
          <ul className="space-y-2">
            {matches.map((m) => {
              const listing = m.listing as unknown as { id: string; title: string; city: string; price: number } | null;
              if (!listing) return null;
              return (
                <li key={m.id} className="flex items-center justify-between border rounded-md p-3">
                  <Link href={`/listings/${listing.id}`} className="font-medium hover:underline">{listing.title}</Link>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="ltr">{formatILS(listing.price)}</span>
                    <Badge variant="teal">{m.match_score}%</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">צפיות</h2>
        {!viewings?.length ? <p className="text-sm text-muted-foreground">אין צפיות</p> : (
          <ul className="space-y-2">
            {viewings.map((v) => {
              const l = v.listing as unknown as { title: string } | null;
              return (
                <li key={v.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
                  <span>{l?.title ?? "נכס"}</span>
                  <span>{formatDateTime(v.scheduled_at)} · {v.status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-1">{children}</div>
    </div>
  );
}
