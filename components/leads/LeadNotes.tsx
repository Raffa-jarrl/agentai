"use client";

import { useState, useEffect, useOptimistic, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface Props {
  leadId: string;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "עכשיו";
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} שעות`;
  const d = Math.floor(h / 24);
  return `לפני ${d} ימים`;
}

export function LeadNotes({ leadId }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const [optimisticNotes, addOptimistic] = useOptimistic<Note[], Note>(
    notes,
    (state, newNote) => [newNote, ...state],
  );

  useEffect(() => {
    fetch(`/api/leads/${leadId}/notes`)
      .then((r) => r.json())
      .then((d: Note[]) => setNotes(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [leadId]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);

    const tempNote: Note = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    startTransition(() => {
      addOptimistic(tempNote);
    });

    const currentContent = content;
    setContent("");

    const res = await fetch(`/api/leads/${leadId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: currentContent.trim() }),
    });

    setSubmitting(false);
    if (res.ok) {
      const newNote = await res.json() as Note;
      setNotes((prev) => [newNote, ...prev]);
    } else {
      toast.error("שגיאה בהוספת הערה");
      setContent(currentContent);
    }
  }

  async function deleteNote(id: string) {
    const res = await fetch(`/api/leads/${leadId}/notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } else {
      toast.error("שגיאה במחיקה");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addNote} className="space-y-2">
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="הוסף הערה..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
          {submitting ? "שומר..." : "הוסף הערה"}
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">טוען...</p>
      ) : optimisticNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין הערות עדיין</p>
      ) : (
        <ul className="space-y-2">
          {optimisticNotes.map((note) => (
            <li key={note.id} className="border rounded-md p-3 bg-muted/30">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm flex-1 whitespace-pre-wrap">{note.content}</p>
                {!note.id.startsWith("temp-") && (
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-muted-foreground hover:text-destructive text-xs flex-shrink-0"
                  >
                    מחק
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(note.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
