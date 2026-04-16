"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ViewingCardData {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  lead: { id: string; full_name: string; phone: string } | null;
  listing: { id: string; title: string; city: string } | null;
}

const statusLabels: Record<string, string> = {
  scheduled: "מתוכנן",
  confirmed: "מאושר",
  completed: "הושלם",
  cancelled: "בוטל",
  no_show: "לא הגיע",
};

const statusVariants: Record<string, "default" | "secondary" | "teal" | "hot" | "warm" | "cold"> = {
  scheduled: "secondary",
  confirmed: "teal",
  completed: "teal",
  cancelled: "hot",
  no_show: "warm",
};

interface Props {
  viewing: ViewingCardData;
  onUpdate: () => void;
}

export function ViewingCard({ viewing, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);

  const formatted = new Date(viewing.scheduled_at).toLocaleString("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function updateStatus(status: string) {
    setLoading(true);
    const res = await fetch(`/api/viewings/${viewing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("הסטטוס עודכן");
      onUpdate();
    } else {
      toast.error("שגיאה בעדכון");
    }
  }

  async function remove() {
    if (!confirm("האם למחוק את הביקור?")) return;
    setLoading(true);
    const res = await fetch(`/api/viewings/${viewing.id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      toast.success("הביקור נמחק");
      onUpdate();
    } else {
      toast.error("שגיאה במחיקה");
    }
  }

  return (
    <div className="border border-border rounded-lg bg-card p-5 space-y-4 shadow-sm hover:shadow-md-hover transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-h3">{viewing.listing?.title ?? "—"}</p>
          <p className="text-sm text-muted-foreground mt-1">{viewing.listing?.city}</p>
        </div>
        <Badge variant={statusVariants[viewing.status] ?? "secondary"} size="default">
          {statusLabels[viewing.status] ?? viewing.status}
        </Badge>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-sm font-semibold text-foreground">{viewing.lead?.full_name ?? "—"}</p>
        <p className="text-xs text-muted-foreground ltr mt-1">{viewing.lead?.phone}</p>
      </div>

      <p className="text-sm font-medium text-foreground">{formatted}</p>

      {viewing.notes && (
        <p className="text-xs text-muted-foreground bg-muted/30 rounded p-2">{viewing.notes}</p>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => updateStatus("completed")}
          className="text-green-600 border-green-300 hover:bg-green-50"
        >
          ✓ הושלם
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => updateStatus("cancelled")}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          ✗ בוטל
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => updateStatus("no_show")}
          className="text-orange-600 border-orange-300 hover:bg-orange-50"
        >
          👻 לא הגיע
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={remove}
          className="mr-auto text-muted-foreground"
        >
          מחק
        </Button>
      </div>
    </div>
  );
}
