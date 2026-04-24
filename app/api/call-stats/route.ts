import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchWeeklyStats } from "@/lib/vapi-stats";

const ASSISTANT_ID = "26457f41-2aaa-4d27-b255-508fad814bb5";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const stats = await fetchWeeklyStats(ASSISTANT_ID);
    return NextResponse.json(stats);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "stats error" },
      { status: 500 }
    );
  }
}
