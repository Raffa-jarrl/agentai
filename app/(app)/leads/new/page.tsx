"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createLead } from "../actions";

export default function NewLeadPage() {
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      full_name: String(fd.get("full_name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      source: "manual" as const,
      budget_min: Number(fd.get("budget_min")) || null,
      budget_max: Number(fd.get("budget_max")) || null,
      preferred_rooms: Number(fd.get("preferred_rooms")) || null,
      preferred_areas: String(fd.get("preferred_areas") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      mortgage_approved: fd.get("mortgage_approved") === "on" ? true : null,
      mortgage_amount: Number(fd.get("mortgage_amount")) || null,
      timeline: (String(fd.get("timeline") || "") || null) as never,
      notes: String(fd.get("notes") ?? "") || null,
      potential_commission: Number(fd.get("potential_commission")) || 0,
    };
    startTransition(async () => {
      const res = await createLead(data);
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ליד חדש</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Row><F name="full_name" label="שם מלא" required /><F name="phone" label="טלפון" required dir="ltr" /></Row>
        <Row>
          <F name="budget_min" label="תקציב מינימלי (₪)" type="number" dir="ltr" />
          <F name="budget_max" label="תקציב מקסימלי (₪)" type="number" dir="ltr" />
        </Row>
        <Row>
          <F name="preferred_rooms" label="חדרים מועדפים" type="number" step="0.5" dir="ltr" />
          <div className="space-y-2">
            <Label htmlFor="timeline">לוח זמנים</Label>
            <select id="timeline" name="timeline" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">—</option>
              <option value="immediate">מיידי</option>
              <option value="1_3_months">1–3 חודשים</option>
              <option value="3_6_months">3–6 חודשים</option>
              <option value="exploring">בוחן אפשרויות</option>
            </select>
          </div>
        </Row>
        <div className="space-y-2">
          <Label htmlFor="preferred_areas">אזורים מועדפים (מופרדים בפסיקים)</Label>
          <Input id="preferred_areas" name="preferred_areas" placeholder="רמת אביב, הרצליה פיתוח" />
        </div>
        <Row>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer mt-6">
            <input type="checkbox" name="mortgage_approved" className="h-4 w-4" />
            <span>אושר משכנתא</span>
          </label>
          <F name="mortgage_amount" label="סכום משכנתא (₪)" type="number" dir="ltr" />
        </Row>
        <F name="potential_commission" label="עמלה פוטנציאלית (₪)" type="number" dir="ltr" />
        <div className="space-y-2">
          <Label htmlFor="notes">הערות</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>
        <Button type="submit" disabled={pending} size="lg">{pending ? "שומר…" : "שמור ליד"}</Button>
      </form>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}

function F({ name, label, ...props }: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
