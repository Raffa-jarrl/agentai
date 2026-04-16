"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PhotoUploader } from "@/components/listings/PhotoUploader";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";

export function PhotographerUpload({ listingId, agentId }: { listingId: string; agentId: string }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (photos.length === 0) { toast.error("יש להעלות לפחות תמונה אחת"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/submit-photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos, notes }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      toast.success("התמונות הוגשו בהצלחה!");
    } catch {
      toast.error("שגיאה בהגשת התמונות");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="h-16 w-16 text-teal-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">התמונות הוגשו בהצלחה!</h2>
        <p className="text-slate-500">הסוכן יבדוק את התמונות ויאשר אותן בקרוב.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2 text-end">תמונות הנכס</label>
        <PhotoUploader
          agentId={agentId}
          value={photos}
          onChange={setPhotos}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-end">הערות לסוכן (אופציונלי)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded-lg p-3 text-end text-sm resize-none h-24 focus:ring-2 focus:ring-brand-blue focus:outline-none"
          placeholder="למשל: צילמתי גם את הנוף מהמרפסת, יש תאורה טובה בסלון..."
        />
      </div>
      <Button onClick={handleSubmit} disabled={loading || photos.length === 0} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
        הגש תמונות לאישור ({photos.length} תמונות)
      </Button>
    </div>
  );
}
