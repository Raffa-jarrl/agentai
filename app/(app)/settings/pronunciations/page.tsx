"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Pronunciation {
  id: string;
  original_text: string;
  phonetic_text: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "he-IL";
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    toast.error("הדפדפן לא תומך בהקראה");
  }
}

export default function PronunciationsPage() {
  const [items, setItems] = useState<Pronunciation[]>([]);
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOriginal, setEditOriginal] = useState("");
  const [editPhonetic, setEditPhonetic] = useState("");
  const [editNotes, setEditNotes] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/pronunciations");
      const d = await r.json();
      setItems(d.pronunciations ?? []);
    } catch {
      toast.error("שגיאה בטעינת מילון");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!original.trim() || !phonetic.trim()) {
      toast.error("נדרשים טקסט מקור וטקסט פונטי");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/pronunciations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ original_text: original, phonetic_text: phonetic, notes }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "שגיאה");
      }
      toast.success("נוסף למילון");
      setOriginal("");
      setPhonetic("");
      setNotes("");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p: Pronunciation) {
    setEditingId(p.id);
    setEditOriginal(p.original_text);
    setEditPhonetic(p.phonetic_text);
    setEditNotes(p.notes ?? "");
  }

  async function saveEdit(id: string) {
    try {
      const r = await fetch(`/api/pronunciations/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          original_text: editOriginal,
          phonetic_text: editPhonetic,
          notes: editNotes,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "שגיאה");
      }
      toast.success("נשמר");
      setEditingId(null);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    }
  }

  async function syncAll() {
    if (!confirm("להריץ סנכרון ניקוד מול DICTA Nakdan? ערכים עם 'manual' בהערות יישארו ללא שינוי.")) return;
    toast.info("מסנכרן... יכול לקחת דקה");
    try {
      const r = await fetch("/api/pronunciations/sync", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "שגיאה");
      toast.success(`סנכרון הושלם: ${d.updated} עודכנו, ${d.unchanged} ללא שינוי, ${d.skipped_manual} ידניים דולגו`);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "שגיאה");
    }
  }

  async function remove(id: string) {
    if (!confirm("למחוק את הערך?")) return;
    try {
      const r = await fetch(`/api/pronunciations/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("שגיאה");
      toast.success("נמחק");
      load();
    } catch {
      toast.error("שגיאה במחיקה");
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">מילון הגייה</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ערכים שמוחלפים לפני TTS של סוכן הטלפון. למשל: &quot;רובע א&quot; → &quot;רובע אַ-לֶף&quot;.
          </p>
        </div>
        <Button variant="outline" onClick={syncAll}>סנכרן עם Nakdan</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>הוסף ערך חדש</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label>טקסט מקור</Label>
              <Input
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="רובע א"
                dir="rtl"
              />
            </div>
            <div className="space-y-1">
              <Label>הגייה</Label>
              <Input
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="רובע ראשון"
                dir="rtl"
              />
            </div>
            <div className="space-y-1">
              <Label>הערות (אופציונלי)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} dir="rtl" />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "שומר..." : "הוסף"}
              </Button>
              {phonetic && (
                <Button type="button" variant="outline" onClick={() => speak(phonetic)}>
                  🔊
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ערכים קיימים ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">טוען...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין ערכים עדיין.</p>
          ) : (
            <div className="space-y-2">
              {items.map((p) => (
                <div key={p.id} className="border rounded-md p-3">
                  {editingId === p.id ? (
                    <div className="grid gap-2 md:grid-cols-4">
                      <Input value={editOriginal} onChange={(e) => setEditOriginal(e.target.value)} dir="rtl" />
                      <Input value={editPhonetic} onChange={(e) => setEditPhonetic(e.target.value)} dir="rtl" />
                      <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} dir="rtl" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(p.id)}>שמור</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>בטל</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-4 items-center">
                      <div dir="rtl" className="font-medium">{p.original_text}</div>
                      <div dir="rtl" className="text-muted-foreground">→ {p.phonetic_text}</div>
                      <div dir="rtl" className="text-xs text-muted-foreground">{p.notes}</div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => speak(p.phonetic_text)}>🔊</Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(p)}>ערוך</Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>מחק</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
