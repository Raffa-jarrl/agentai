import Link from "next/link";
import { Flame, Calendar, Timer, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatILS } from "@/lib/formatters/currency";
import { formatDateTime } from "@/lib/formatters/date";

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay(); // Sunday = 0 in Israel
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}
function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 7);
  return e;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const now = new Date();
  const weekStart = startOfWeek(now).toISOString();
  const weekEnd = endOfWeek(now).toISOString();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart); todayEnd.setDate(todayStart.getDate() + 1);

  const [{ count: hotCount }, { count: viewingsCount }, { data: pipelineLeads }, { data: todayFollowups }, { data: todayViewings }, { data: pendingContent }, { data: recentLeads }] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("score", "hot"),
    supabase.from("viewings").select("id", { count: "exact", head: true }).gte("scheduled_at", weekStart).lt("scheduled_at", weekEnd),
    supabase.from("leads").select("potential_commission").not("status", "in", '("closed_lost","inactive")'),
    supabase.from("leads").select("id, full_name, next_followup_at, score").gte("next_followup_at", todayStart.toISOString()).lt("next_followup_at", todayEnd.toISOString()).order("next_followup_at"),
    supabase.from("viewings").select("id, scheduled_at, status, lead:leads(full_name), listing:listings(title)").gte("scheduled_at", todayStart.toISOString()).lt("scheduled_at", todayEnd.toISOString()).order("scheduled_at"),
    supabase.from("content_posts").select("id, post_type, scheduled_for").eq("status", "draft").limit(5),
    supabase.from("leads").select("id, full_name, score, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const pipelineValue = (pipelineLeads ?? []).reduce((sum, l) => sum + (l.potential_commission ?? 0), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">לוח בקרה</h1>
        <p className="text-muted-foreground text-sm">מה קורה אצלך היום</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={Flame} label="לידים חמים" value={hotCount ?? 0} variant="hot" />
        <Metric icon={Calendar} label="צפיות השבוע" value={viewingsCount ?? 0} />
        <Metric icon={Timer} label="זמן תגובה ממוצע" value="—" hint="בקרוב" />
        <Metric icon={TrendingUp} label="שווי צינור" value={<span className="ltr">{formatILS(pipelineValue)}</span>} variant="teal" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>מה לעשות היום</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Block title={`מעקב (${todayFollowups?.length ?? 0})`}>
              {!todayFollowups?.length ? <Empty>אין מעקבים להיום</Empty> : (
                <ul className="space-y-1 text-sm">
                  {todayFollowups.map((l) => (
                    <li key={l.id}>
                      <Link href={`/leads/${l.id}`} className="flex items-center justify-between hover:bg-muted rounded px-2 py-1">
                        <span>{l.full_name}</span>
                        <Badge variant={l.score}>•</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Block>
            <Block title={`צפיות (${todayViewings?.length ?? 0})`}>
              {!todayViewings?.length ? <Empty>אין צפיות היום</Empty> : (
                <ul className="space-y-1 text-sm">
                  {todayViewings.map((v) => {
                    const lead = v.lead as unknown as { full_name: string } | null;
                    const listing = v.listing as unknown as { title: string } | null;
                    return (
                      <li key={v.id} className="flex items-center justify-between px-2 py-1">
                        <span>{lead?.full_name} · {listing?.title}</span>
                        <span className="text-muted-foreground text-xs">{formatDateTime(v.scheduled_at)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Block>
            <Block title={`תוכן לאישור (${pendingContent?.length ?? 0})`}>
              {!pendingContent?.length ? <Empty>אין תוכן ממתין</Empty> : (
                <Button asChild variant="outline" size="sm"><Link href="/content">צפה בתור</Link></Button>
              )}
            </Block>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>פעילות אחרונה</CardTitle></CardHeader>
          <CardContent>
            {!recentLeads?.length ? <Empty>אין פעילות עדיין</Empty> : (
              <ul className="space-y-1 text-sm">
                {recentLeads.map((l) => (
                  <li key={l.id}>
                    <Link href={`/leads/${l.id}`} className="flex items-center justify-between hover:bg-muted rounded px-2 py-1">
                      <span>ליד חדש · {l.full_name}</span>
                      <Badge variant={l.score}>•</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, hint, variant }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; hint?: string; variant?: "hot" | "teal" }) {
  const color = variant === "hot" ? "text-hot" : variant === "teal" ? "text-teal" : "text-brand";
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
