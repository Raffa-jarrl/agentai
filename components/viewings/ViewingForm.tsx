"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Listing {
  id: string;
  title: string;
  city: string;
}

interface Lead {
  id: string;
  full_name: string;
  phone: string;
}

interface Props {
  onCreated: () => void;
}

export function ViewingForm({ onCreated }: Props) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [listingId, setListingId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/viewings/options")
      .then((r) => r.json())
      .then((d: { listings: Listing[]; leads: Lead[] }) => {
        setListings(d.listings ?? []);
        setLeads(d.leads ?? []);
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!listingId || !leadId || !scheduledAt) {
      toast.error("נא למלא את כל השדות");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/viewings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId, listing_id: listingId, scheduled_at: scheduledAt, notes }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success("הביקור נקבע בהצלחה");
      setListingId("");
      setLeadId("");
      setScheduledAt("");
      setNotes("");
      onCreated();
    } else {
      const d = await res.json() as { error?: string };
      toast.error(d.error ?? "שגיאה ביצירת ביקור");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <Label>נכס</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          required
        >
          <option value="">בחר נכס...</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.title} — {l.city}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label>ליד</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          required
        >
          <option value="">בחר ליד...</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>{l.full_name} — {l.phone}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label>תאריך ושעה</Label>
        <Input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label>הערות</Label>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="הערות לביקור..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "שומר..." : "קבע ביקור"}
      </Button>
    </form>
  );
}
