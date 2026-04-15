"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIsraeliPhone } from "@/lib/formatters/phone";

interface MatchRow {
  id: string;
  match_score: number;
  match_reasons: string[];
  notification_sent: boolean;
  lead: { id: string; full_name: string; phone: string; score: "hot" | "warm" | "cold" } | null;
}

const reasonLabels: Record<string, string> = {
  budget_match: "תקציב",
  budget_close: "תקציב קרוב",
  area_match: "אזור",
  rooms_match: "חדרים",
  rooms_close: "חדרים קרוב",
  mortgage_approved: "משכנתא",
};

export function MatchesPanel({ listingId, matches }: { listingId: string; matches: MatchRow[] }) {
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  if (!matches.length) {
    return <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">אין התאמות עדיין</div>;
  }

  function notify(matchId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/listings/${listingId}/notify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ match_id: matchId }),
      });
      if (res.ok) {
        setSent((s) => ({ ...s, [matchId]: true }));
        toast.success("הודעה נשלחה (סנדבוקס)");
      } else {
        toast.error("שליחה נכשלה");
      }
    });
  }

  return (
    <ul className="space-y-2">
      {matches.map((m) => {
        const lead = m.lead;
        if (!lead) return null;
        const isSent = m.notification_sent || sent[m.id];
        return (
          <li key={m.id} className="flex items-center justify-between border rounded-md p-3 bg-card gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Badge variant={lead.score}>{m.match_score}%</Badge>
              <div className="min-w-0">
                <Link href={`/leads/${lead.id}`} className="font-medium hover:underline truncate">{lead.full_name}</Link>
                <div className="text-xs text-muted-foreground ltr">{formatIsraeliPhone(lead.phone)}</div>
              </div>
              <div className="hidden md:flex gap-1 flex-wrap">
                {m.match_reasons.map((r) => (
                  <Badge key={r} variant="outline" className="text-[10px]">{reasonLabels[r] ?? r}</Badge>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              variant={isSent ? "secondary" : "teal"}
              disabled={pending || isSent}
              onClick={() => notify(m.id)}
            >
              {isSent ? <><Check className="h-4 w-4" /> נשלח</> : <><MessageCircle className="h-4 w-4" /> שלח ב-WhatsApp</>}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
