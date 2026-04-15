"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";

interface Props {
  agentId: string;
  value: string[];
  onChange: (urls: string[]) => void;
}

export function PhotoUploader({ agentId, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${agentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("listing-photos").upload(path, file, { upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      onChange([...value, ...urls]);
    } catch (e) {
      toast.error("שגיאה בהעלאת תמונה");
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {value.map((url) => (
          <div key={url} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
            <Image src={url} alt="" fill sizes="150px" className="object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-1 hover:bg-black"
              aria-label="הסר תמונה"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="aspect-square rounded-md border-2 border-dashed border-input flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:bg-muted transition-colors">
          <Camera className="h-6 w-6 mb-1" />
          <span className="text-xs">{uploading ? "מעלה…" : "הוסף תמונה"}</span>
          <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">אפשר להעלות כמה תמונות. במובייל המצלמה נפתחת ישירות.</p>
    </div>
  );
}
