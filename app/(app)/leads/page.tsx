import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/leads/KanbanBoard";

export default async function LeadsPage() {
  const supabase = createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, full_name, phone, score, score_value, status, budget_min, budget_max, preferred_areas, mortgage_approved, last_contact_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול לידים</h1>
        <Button asChild><Link href="/leads/new"><Plus className="h-4 w-4" /> ליד חדש</Link></Button>
      </header>

      {!leads?.length ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">עדיין אין לידים</p>
          <Button asChild><Link href="/leads/new">הוסף ליד ראשון</Link></Button>
        </div>
      ) : (
        <KanbanBoard initialLeads={leads as never} />
      )}
    </div>
  );
}
