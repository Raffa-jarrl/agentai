"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhotoUploader } from "./PhotoUploader";
import { createListing } from "@/app/(app)/listings/actions";
import type { PropertyType } from "@/types/database";

const propertyLabels: Record<PropertyType, string> = {
  apartment: "דירה",
  house: "בית",
  penthouse: "פנטהאוז",
  land: "קרקע",
  commercial: "מסחרי",
};

export function ListingForm({ agentId }: { agentId: string }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [aiDescription, setAiDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pending, startTransition] = useTransition();

  async function generate(formData: FormData) {
    setGenerating(true);
    try {
      const body = {
        title: String(formData.get("title") ?? ""),
        property_type: String(formData.get("property_type") ?? ""),
        rooms: Number(formData.get("rooms")) || null,
        size_sqm: Number(formData.get("size_sqm")) || null,
        price: Number(formData.get("price")) || null,
        city: String(formData.get("city") ?? ""),
        neighborhood: String(formData.get("neighborhood") ?? "") || null,
        features: [
          formData.get("parking") ? "חניה" : null,
          formData.get("elevator") ? "מעלית" : null,
          formData.get("renovated") ? "משופץ" : null,
        ].filter(Boolean) as string[],
        hint: String(formData.get("ai_hint") ?? ""),
      };
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const { description } = await res.json();
      setAiDescription(description);
      toast.success("התיאור נוצר — ערוך אם צריך");
    } catch (e) {
      toast.error("שגיאה ביצירת תיאור");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") ?? ""),
      property_type: fd.get("property_type") as PropertyType,
      rooms: Number(fd.get("rooms")) || null,
      size_sqm: Number(fd.get("size_sqm")) || null,
      price: Number(fd.get("price")) || 0,
      city: String(fd.get("city") ?? ""),
      neighborhood: String(fd.get("neighborhood") ?? "") || null,
      address: String(fd.get("address") ?? "") || null,
      floor: Number(fd.get("floor")) || null,
      total_floors: Number(fd.get("total_floors")) || null,
      parking: fd.get("parking") === "on",
      elevator: fd.get("elevator") === "on",
      renovated: fd.get("renovated") === "on",
      description: aiDescription || String(fd.get("description") ?? "") || null,
      photos,
      ai_generated_description: aiDescription || undefined,
    };
    startTransition(async () => {
      const result = await createListing(payload);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">פרטי הנכס</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field name="title" label="כותרת" required />
          <div className="space-y-2">
            <Label htmlFor="property_type">סוג נכס</Label>
            <select id="property_type" name="property_type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {Object.entries(propertyLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <Field name="rooms" label="חדרים" type="number" step="0.5" dir="ltr" />
          <Field name="size_sqm" label="גודל (מ״ר)" type="number" dir="ltr" />
          <Field name="price" label="מחיר (₪)" type="number" required dir="ltr" />
          <Field name="city" label="עיר" required />
          <Field name="neighborhood" label="שכונה" />
          <Field name="address" label="כתובת" />
          <Field name="floor" label="קומה" type="number" dir="ltr" />
          <Field name="total_floors" label="סך קומות בבניין" type="number" dir="ltr" />
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <Checkbox name="parking" label="חניה" />
          <Checkbox name="elevator" label="מעלית" />
          <Checkbox name="renovated" label="משופץ" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">תמונות</h2>
        <PhotoUploader agentId={agentId} value={photos} onChange={setPhotos} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">תיאור</h2>
          <Button
            type="button"
            variant="teal"
            size="sm"
            disabled={generating}
            onClick={(e) => {
              const form = (e.currentTarget.closest("form") as HTMLFormElement) ?? null;
              if (form) generate(new FormData(form));
            }}
          >
            <Sparkles className="h-4 w-4" />
            {generating ? "יוצר…" : "צור תיאור עם AI"}
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai_hint">רמז לכתיבה (טיפ לסוכן — אופציונלי)</Label>
          <Input id="ai_hint" name="ai_hint" placeholder="למשל: דירה עם נוף פתוח לים, שיפוץ מאפס 2024" />
        </div>
        <Textarea
          name="description"
          value={aiDescription}
          onChange={(e) => setAiDescription(e.target.value)}
          rows={10}
          placeholder="לחץ ׳צור תיאור עם AI׳ או כתוב ידנית…"
        />
      </section>

      <Button type="submit" size="lg" disabled={pending} className="w-full md:w-auto">
        {pending ? "שומר…" : "שמור נכס"}
      </Button>
    </form>
  );
}

function Field({ name, label, ...props }: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}

function Checkbox({ name, label }: { name: string; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" name={name} className="h-4 w-4 rounded border-input" />
      <span>{label}</span>
    </label>
  );
}
