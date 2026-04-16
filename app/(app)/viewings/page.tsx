"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewingCard } from "@/components/viewings/ViewingCard";
import { ViewingForm } from "@/components/viewings/ViewingForm";

type Tab = "upcoming" | "past" | "all";

interface Viewing {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  lead: { id: string; full_name: string; phone: string } | null;
  listing: { id: string; title: string; city: string } | null;
}

export default function ViewingsPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchViewings = useCallback(async () => {
    setLoading(true);
    const url = tab === "upcoming" ? "/api/viewings?upcoming=true" : "/api/viewings";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json() as Viewing[];
      const now = new Date();
      if (tab === "past") {
        setViewings(data.filter((v) => new Date(v.scheduled_at) < now));
      } else {
        setViewings(data);
      }
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchViewings();
  }, [fetchViewings]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "upcoming", label: "קרובים" },
    { id: "past", label: "עבר" },
    { id: "all", label: "הכל" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ביקורים</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 ml-1" />
          קבע ביקור
        </Button>
      </header>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">קביעת ביקור</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <ViewingForm onCreated={() => { setShowForm(false); fetchViewings(); }} />
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">טוען...</div>
      ) : !viewings.length ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">אין ביקורים</p>
          <Button onClick={() => setShowForm(true)}>קבע ביקור ראשון</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {viewings.map((v) => (
            <ViewingCard key={v.id} viewing={v} onUpdate={fetchViewings} />
          ))}
        </div>
      )}
    </div>
  );
}
