import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GenerateControls } from "@/components/content/GenerateDialog";
import { PostCard } from "@/components/content/PostCard";
import type { ContentPost } from "@/types/database";

export default async function ContentPage() {
  const supabase = createClient();
  const [{ data: posts }, { data: listings }] = await Promise.all([
    supabase.from("content_posts").select("*").order("created_at", { ascending: false }),
    supabase.from("listings").select("id, title").eq("status", "active").order("created_at", { ascending: false }),
  ]);

  const drafts = (posts ?? []).filter((p) => p.status === "draft");
  const ready = (posts ?? []).filter((p) => p.status === "ready");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">תוכן לרשתות</h1>
        <p className="text-muted-foreground text-sm">צור פוסטים לאינסטגרם ולפייסבוק, אשר וערוך לפני פרסום</p>
      </header>

      <GenerateControls listings={listings ?? []} />

      <section>
        <h2 className="text-lg font-semibold mb-3">ממתינים לאישור ({drafts.length})</h2>
        {!drafts.length ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2" /> אין טיוטות
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-3">
            {drafts.map((p) => <PostCard key={p.id} post={p as ContentPost} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">מוכנים להעלאה ({ready.length})</h2>
        {!ready.length ? (
          <p className="text-sm text-muted-foreground">אין פוסטים מוכנים</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-3">
            {ready.map((p) => <PostCard key={p.id} post={p as ContentPost} />)}
          </div>
        )}
      </section>
    </div>
  );
}
