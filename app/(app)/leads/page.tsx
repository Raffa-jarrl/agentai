"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/leads/KanbanBoard";
import { LeadFilters, type LeadFilters as Filters } from "@/components/leads/LeadFilters";
import { createClient } from "@/lib/supabase/client";
import type { Lead } from "@/types/database";

type LeadCardData = Pick<
  Lead,
  "id" | "full_name" | "phone" | "score" | "score_value" | "status" | "budget_min" | "budget_max" | "preferred_areas" | "mortgage_approved" | "last_contact_at"
> & { source?: string };

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadCardData[]>([]);
  const [filtered, setFiltered] = useState<LeadCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, full_name, phone, score, score_value, status, budget_min, budget_max, preferred_areas, mortgage_approved, last_contact_at, source")
        .order("created_at", { ascending: false });
      const all = (data ?? []) as LeadCardData[];
      setLeads(all);
      setFiltered(all);
      setLoading(false);
    })();
  }, []);

  function handleFilter(f: Filters) {
    let result = leads;
    if (f.search) {
      const q = f.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.full_name.toLowerCase().includes(q) ||
          l.phone.includes(q),
      );
    }
    if (f.score) result = result.filter((l) => l.score === f.score);
    if (f.status) result = result.filter((l) => l.status === f.status);
    if (f.source) result = result.filter((l) => (l as LeadCardData & { source?: string }).source === f.source);
    if (f.budgetMin) result = result.filter((l) => (l.budget_min ?? 0) >= parseInt(f.budgetMin));
    if (f.budgetMax) result = result.filter((l) => (l.budget_max ?? Infinity) <= parseInt(f.budgetMax));
    setFiltered(result);
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-h2">ניהול לידים</h1>
        </header>
        <div className="text-center py-16 text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-h2">ניהול לידים</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/export/leads" download>
              <Download className="h-4 w-4 ml-1" />
              ייצוא CSV
            </a>
          </Button>
          <Button asChild><Link href="/leads/new"><Plus className="h-4 w-4" /> ליד חדש</Link></Button>
        </div>
      </header>

      <LeadFilters onFilter={handleFilter} />

      {!leads.length ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">עדיין אין לידים</p>
          <Button asChild><Link href="/leads/new">הוסף ליד ראשון</Link></Button>
        </div>
      ) : (
        <KanbanBoard initialLeads={filtered as never} />
      )}
    </div>
  );
}
