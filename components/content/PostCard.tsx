"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updatePost, deletePost } from "@/app/(app)/content/actions";
import type { ContentPost } from "@/types/database";

const typeLabels: Record<string, string> = {
  listing_highlight: "הדגשת נכס",
  market_tip: "טיפ לשוק",
  neighborhood_guide: "מדריך שכונה",
  testimonial: "המלצה",
  general: "כללי",
};

export function PostCard({ post }: { post: ContentPost }) {
  const [caption, setCaption] = useState(post.caption_hebrew);
  const [fbCaption, setFbCaption] = useState(post.caption_facebook ?? "");
  const [adCaption, setAdCaption] = useState(post.caption_ad ?? "");
  const [tab, setTab] = useState<"ig" | "fb" | "ad">("ig");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const visibleCaption = tab === "ig" ? caption : tab === "fb" ? fbCaption || caption : adCaption || caption;

  function copy() {
    const hashtagLine = post.hashtags?.length ? "\n\n" + post.hashtags.map((h) => (h.startsWith("#") ? h : "#" + h)).join(" ") : "";
    navigator.clipboard.writeText(visibleCaption + hashtagLine);
    setCopied(true);
    toast.success("הועתק");
    setTimeout(() => setCopied(false), 1500);
  }

  function save(status?: ContentPost["status"]) {
    startTransition(async () => {
      const res = await updatePost(post.id, {
        caption_hebrew: caption,
        caption_facebook: fbCaption || null,
        caption_ad: adCaption || null,
        ...(status ? { status } : {}),
      });
      if (res?.error) toast.error(res.error);
      else toast.success(status === "ready" ? "אושר" : "נשמר");
    });
  }

  function del() {
    if (!confirm("למחוק את הפוסט?")) return;
    startTransition(async () => {
      await deletePost(post.id);
    });
  }

  return (
    <div className="border rounded-lg bg-card p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{typeLabels[post.post_type] ?? post.post_type}</Badge>
          <Badge variant={post.status === "ready" ? "teal" : "outline"}>{post.status}</Badge>
        </div>
        <div className="flex gap-1 text-xs">
          <button className={`px-2 py-1 rounded ${tab === "ig" ? "bg-brand text-white" : "bg-muted"}`} onClick={() => setTab("ig")}>אינסטגרם</button>
          <button className={`px-2 py-1 rounded ${tab === "fb" ? "bg-brand text-white" : "bg-muted"}`} onClick={() => setTab("fb")}>פייסבוק</button>
          <button className={`px-2 py-1 rounded ${tab === "ad" ? "bg-brand text-white" : "bg-muted"}`} onClick={() => setTab("ad")}>מודעה</button>
        </div>
      </div>

      <Textarea
        value={tab === "ig" ? caption : tab === "fb" ? fbCaption : adCaption}
        onChange={(e) => {
          const v = e.target.value;
          if (tab === "ig") setCaption(v);
          else if (tab === "fb") setFbCaption(v);
          else setAdCaption(v);
        }}
        rows={6}
        className="text-sm"
      />

      {post.hashtags?.length ? (
        <div className="flex flex-wrap gap-1">
          {post.hashtags.map((h) => (
            <Badge key={h} variant="outline" className="text-[10px]">{h.startsWith("#") ? h : "#" + h}</Badge>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} העתק</Button>
          <Button size="sm" variant="ghost" onClick={del} disabled={pending}><Trash2 className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => save()} disabled={pending}>שמור</Button>
          <Button size="sm" variant="teal" onClick={() => save("ready")} disabled={pending}><Send className="h-4 w-4" /> אשר להעלאה</Button>
        </div>
      </div>
    </div>
  );
}
