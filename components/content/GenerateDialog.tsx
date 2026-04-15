"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Listing { id: string; title: string; }

export function GenerateControls({ listings }: { listings: Listing[] }) {
  const [pending, startTransition] = useTransition();
  const [batchPending, setBatchPending] = useState(false);
  const router = useRouter();

  function onGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      listing_id: (fd.get("listing_id") as string) || null,
      topic: (fd.get("topic") as string) || null,
      post_type: fd.get("post_type") || "general",
      platform: fd.get("platform") || "both",
    };
    startTransition(async () => {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("פוסט נוצר");
        router.refresh();
      } else {
        toast.error("שגיאה ביצירת פוסט");
      }
    });
  }

  async function onBatch() {
    setBatchPending(true);
    try {
      const res = await fetch("/api/content/batch", { method: "POST" });
      if (res.ok) {
        const { created } = await res.json();
        toast.success(`נוצרו ${created} פוסטים`);
        router.refresh();
      } else {
        toast.error("שגיאה");
      }
    } finally {
      setBatchPending(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-card space-y-4">
      <form onSubmit={onGenerate} className="grid md:grid-cols-5 gap-3 items-end">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="listing_id">נכס (אופציונלי)</Label>
          <select id="listing_id" name="listing_id" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">— ללא —</option>
            {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="topic">נושא (או השאר ריק אם בחרת נכס)</Label>
          <Input id="topic" name="topic" placeholder="למשל: טיפים לקונים ראשונים" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="post_type">סוג</Label>
          <select id="post_type" name="post_type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="listing_highlight">הדגשת נכס</option>
            <option value="market_tip">טיפ לשוק</option>
            <option value="neighborhood_guide">מדריך שכונה</option>
            <option value="testimonial">המלצה</option>
            <option value="general">כללי</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform">פלטפורמה</Label>
          <select id="platform" name="platform" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="both">שניהם</option>
            <option value="instagram">אינסטגרם</option>
            <option value="facebook">פייסבוק</option>
          </select>
        </div>
        <Button type="submit" disabled={pending} className="md:col-span-5"><Sparkles className="h-4 w-4" />{pending ? "יוצר…" : "צור פוסט"}</Button>
      </form>
      <div className="border-t pt-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">צור 30 פוסטים לחודש אוטומטית</p>
        <Button variant="teal" size="sm" onClick={onBatch} disabled={batchPending}>
          {batchPending ? "יוצר…" : "Batch 30"}
        </Button>
      </div>
    </div>
  );
}
