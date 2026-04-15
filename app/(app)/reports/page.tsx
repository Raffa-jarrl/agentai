import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatILS } from "@/lib/formatters/currency";
import { formatDate } from "@/lib/formatters/date";

export default async function ReportsPage() {
  const supabase = createClient();
  const { data: reports } = await supabase
    .from("weekly_reports")
    .select("*")
    .order("week_start", { ascending: false })
    .limit(12);

  const latest = reports?.[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">דוחות שבועיים</h1>
        <p className="text-muted-foreground text-sm">סיכום ROI — כמה חסכנו לך בזמן ומה הצינור שלך</p>
      </header>

      {!reports?.length ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg text-muted-foreground">
          הדוח הראשון יופק ביום ראשון הקרוב
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>השבוע האחרון ({formatDate(latest!.week_start)} – {formatDate(latest!.week_end)})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="הודעות שטופלו" value={latest!.messages_handled} />
                <Stat label="לידים חמים" value={latest!.hot_leads_count} />
                <Stat label="צפיות" value={latest!.viewings_booked} />
                <Stat label="שעות חסכנו" value={latest!.hours_saved} />
                <Stat label="שווי צינור" value={<span className="ltr">{formatILS(latest!.pipeline_value)}</span>} />
                <Stat label="פוסטים" value={latest!.content_posts_generated} />
              </div>
              {latest!.highlights?.length ? (
                <ul className="mt-4 space-y-1 text-sm">
                  {latest!.highlights.map((h: string, i: number) => <li key={i}>• {h}</li>)}
                </ul>
              ) : null}
            </CardContent>
          </Card>

          <section>
            <h2 className="text-lg font-semibold mb-3">היסטוריה</h2>
            <div className="space-y-2">
              {reports.slice(1).map((r) => (
                <div key={r.id} className="border rounded-md p-3 bg-card flex items-center justify-between text-sm">
                  <span>{formatDate(r.week_start)} – {formatDate(r.week_end)}</span>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>{r.messages_handled} הודעות</span>
                    <span>{r.viewings_booked} צפיות</span>
                    <span className="ltr">{formatILS(r.pipeline_value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
