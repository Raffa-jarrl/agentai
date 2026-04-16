import Link from "next/link";
import { Flame, Calendar, Timer, TrendingUp, Users, Home, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
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
    <div className="space-y-8">
      <header>
        <h1 className="text-h2">לוח בקרה</h1>
        <p className="text-muted-foreground text-sm">מה קורה אצלך היום</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Flame className="h-5 w-5" />} label="לידים חמים" value={hotCount ?? 0} trendColor="red" />
        <StatCard icon={<Calendar className="h-5 w-5" />} label="צפיות השבוע" value={viewingsCount ?? 0} />
        <StatCard icon={<Timer className="h-5 w-5" />} label="זמן תגובה" value="—" description="בקרוב" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="שווי צינור" value={<span className="ltr">{formatILS(pipelineValue)}</span>} trendColor="emerald" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/leads/new", label: "הוסף ליד חדש", icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400" },
          { href: "/listings/new", label: "הוסף נכס", icon: Home, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400" },
          { href: "/content", label: "צור תוכן", icon: Sparkles, color: "text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400" },
          { href: "/viewings", label: "ביקורים היום", icon: Calendar, color: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-5 hover:shadow-md-hover hover:border-brand/30 transition-all duration-200 text-center"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-semibold">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>מה לעשות היום</CardTitle></CardHeader>
          <CardContent className="space-y-6">
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

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3 text-foreground">{title}</h4>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
