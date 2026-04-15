import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Batch-generate 30 posts for the month by fanning out to /api/content/generate.
 * Mix: active listings (highlight) + market tips + neighborhood guides.
 */
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: listings } = await supabase
    .from("listings")
    .select("id, neighborhood, city")
    .eq("agent_id", user.id)
    .eq("status", "active");

  const jobs: Array<{ listing_id?: string | null; topic?: string; post_type: "listing_highlight" | "market_tip" | "neighborhood_guide" | "general" }> = [];

  (listings ?? []).forEach((l) => jobs.push({ listing_id: l.id, post_type: "listing_highlight" }));

  const tips = [
    "5 שאלות לשאול לפני רכישת דירה ראשונה",
    "טיפים למשא ומתן על מחיר דירה",
    "איך לבחור שכונה שמתאימה למשפחה",
    "מה כולל תהליך אישור משכנתא",
    "שיפוץ לעומת כניסה ישירה — מה כדאי?",
  ];
  tips.forEach((t) => jobs.push({ topic: t, post_type: "market_tip" }));

  const seen = new Set<string>();
  (listings ?? []).forEach((l) => {
    const key = l.neighborhood ?? l.city;
    if (!seen.has(key)) {
      seen.add(key);
      jobs.push({ topic: `מדריך שכונה: ${key}`, post_type: "neighborhood_guide" });
    }
  });

  const target = 30;
  while (jobs.length < target) {
    jobs.push({ topic: "טיפ השבוע לקונים ומוכרים בישראל", post_type: "general" });
  }

  const origin = new URL("/api/content/generate", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString();
  const cookie = (await import("next/headers")).cookies().toString();

  // Fire them in small parallel batches to avoid overloading Anthropic
  const chunks = 4;
  let created = 0;
  for (let i = 0; i < jobs.slice(0, target).length; i += chunks) {
    const batch = jobs.slice(i, i + chunks);
    await Promise.all(
      batch.map((job) =>
        fetch(origin, {
          method: "POST",
          headers: { "content-type": "application/json", cookie },
          body: JSON.stringify({ ...job, platform: "both" }),
        }).then((r) => { if (r.ok) created += 1; }),
      ),
    );
  }

  return NextResponse.json({ created });
}
