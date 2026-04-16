"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Submission {
  id: string;
  photos: string[];
  notes: string | null;
  status: string;
  created_at: string;
}

interface Campaign {
  instagram_caption: string;
  instagram_hashtags: string[];
  facebook_post: string;
  facebook_ad_headline: string;
  facebook_ad_body: string;
  yad2_title: string;
  yad2_description: string;
  madlan_title: string;
  madlan_description: string;
}

type TabKey = "instagram" | "facebook" | "yad2" | "madlan";

export function PhotoReview({ listingId, submissions }: { listingId: string; submissions: Submission[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("instagram");

  async function handleApprove(submission: Submission) {
    setLoading(submission.id);
    try {
      const res = await fetch(`/api/listings/${listingId}/submit-photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submission.id, status: "approved" }),
      });
      if (!res.ok) throw new Error();
      toast.success("תמונות אושרו! מייצר קמפיין...");
      // Auto-generate campaign
      const campRes = await fetch(`/api/listings/${listingId}/generate-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submission.id }),
      });
      if (campRes.ok) {
        const camp = await campRes.json() as Campaign;
        setCampaign(camp);
        toast.success("קמפיין נוצר בהצלחה!");
      }
    } catch {
      toast.error("שגיאה באישור התמונות");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject(submission: Submission) {
    setLoading(submission.id + "_reject");
    try {
      await fetch(`/api/listings/${listingId}/submit-photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submission.id, status: "rejected", rejection_reason: "התמונות אינן עומדות בדרישות" }),
      });
      toast.success("הגשה נדחתה");
    } catch {
      toast.error("שגיאה");
    } finally {
      setLoading(null);
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "yad2", label: "יד2" },
    { key: "madlan", label: "מדלן" },
  ];

  return (
    <div className="space-y-6">
      {submissions.length === 0 && (
        <p className="text-center text-slate-500 py-8">אין הגשות תמונות עדיין</p>
      )}

      {submissions.map((sub) => (
        <div key={sub.id} className="border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">הוגש {new Date(sub.created_at).toLocaleDateString("he-IL")}</span>
            <Badge variant={sub.status === "approved" ? "teal" : "secondary"} className={sub.status === "rejected" ? "bg-red-100 text-red-700" : ""}>
              {sub.status === "approved" ? "מאושר" : sub.status === "rejected" ? "נדחה" : "ממתין"}
            </Badge>
          </div>

          {sub.notes && <p className="text-sm text-slate-600 bg-slate-50 rounded p-2">{sub.notes}</p>}

          <div className="grid grid-cols-3 gap-2">
            {sub.photos.map((photo, i) => (
              <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                <Image src={photo} alt={`תמונה ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>

          {sub.status === "pending" && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReject(sub)}
                disabled={!!loading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {loading === sub.id + "_reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 me-1" />}
                דחה
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(sub)}
                disabled={!!loading}
              >
                {loading === sub.id ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <CheckCircle className="h-4 w-4 me-1" />}
                אשר וצור קמפיין
              </Button>
            </div>
          )}
        </div>
      ))}

      {campaign && (
        <div className="border-2 border-brand-blue rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-brand-blue">
            <Sparkles className="h-5 w-5" />
            קמפיין שיווקי נוצר
          </div>

          <div className="flex gap-2 border-b pb-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === t.key ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "instagram" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">כיתוב</label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{campaign.instagram_caption}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">האשטגים</label>
                <p className="text-sm mt-1 text-brand-blue">{campaign.instagram_hashtags?.map(h => `#${h}`).join(" ")}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                void navigator.clipboard.writeText(campaign.instagram_caption + "\n\n" + campaign.instagram_hashtags?.map(h => `#${h}`).join(" "));
                toast.success("הועתק!");
              }}>
                העתק לאינסטגרם
              </Button>
            </div>
          )}

          {activeTab === "facebook" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">פוסט</label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{campaign.facebook_post}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">כותרת מודעה</label>
                  <p className="text-sm mt-1 font-medium">{campaign.facebook_ad_headline}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">גוף מודעה</label>
                  <p className="text-sm mt-1">{campaign.facebook_ad_body}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                void navigator.clipboard.writeText(campaign.facebook_post);
                toast.success("הועתק!");
              }}>
                העתק לפייסבוק
              </Button>
            </div>
          )}

          {activeTab === "yad2" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">כותרת</label>
                <p className="text-sm mt-1 font-medium">{campaign.yad2_title}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">תיאור</label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{campaign.yad2_description}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                void navigator.clipboard.writeText(campaign.yad2_title + "\n\n" + campaign.yad2_description);
                toast.success("הועתק ליד2!");
              }}>
                העתק ליד2
              </Button>
            </div>
          )}

          {activeTab === "madlan" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">כותרת</label>
                <p className="text-sm mt-1 font-medium">{campaign.madlan_title}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">תיאור</label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{campaign.madlan_description}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                void navigator.clipboard.writeText(campaign.madlan_title + "\n\n" + campaign.madlan_description);
                toast.success("הועתק למדלן!");
              }}>
                העתק למדלן
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
