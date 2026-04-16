"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Sparkles, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface Submission {
  id: string;
  photos: string[];
  notes: string | null;
  status: string;
  created_at: string;
}

interface CarouselSlide {
  slide: number;
  headline: string;
  body: string;
  cta: string | null;
}

interface Campaign {
  instagram_caption: string;
  instagram_hashtags: string[];
  instagram_carousel: CarouselSlide[];
  facebook_post: string;
  facebook_ad_headline: string;
  facebook_ad_body: string;
  yad2_title: string;
  yad2_description: string;
  madlan_title: string;
  madlan_description: string;
}

type TabKey = "instagram" | "carousel" | "facebook" | "yad2" | "madlan";

function CarouselPreview({ slides, photos }: { slides: CarouselSlide[]; photos: string[] }) {
  const [current, setCurrent] = useState(0);
  if (!slides || slides.length === 0) return null;

  const slide = slides[current];
  const photo = photos[Math.min(current, photos.length - 1)];

  return (
    <div className="space-y-4">
      {/* Phone mockup */}
      <div className="relative mx-auto w-64 rounded-3xl overflow-hidden border-4 border-slate-800 bg-slate-900 shadow-2xl">
        {/* Instagram header */}
        <div className="bg-white px-3 py-2 flex items-center gap-2 border-b">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600" />
          <span className="text-xs font-semibold">סוכן נדל״ן</span>
          <span className="text-xs text-slate-400 ms-auto">עוקב</span>
        </div>

        {/* Image area */}
        <div className="relative aspect-square bg-slate-200">
          {photo ? (
            <Image src={photo} alt={`שקופית ${current + 1}`} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-teal-500" />
          )}
          {/* Slide overlay */}
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-white font-bold text-sm leading-tight mb-1">{slide?.headline}</p>
            <p className="text-white/90 text-xs leading-snug">{slide?.body}</p>
            {slide?.cta && (
              <span className="mt-2 bg-white text-brand-blue text-xs font-bold px-3 py-1 rounded-full">
                {slide.cta}
              </span>
            )}
          </div>
          {/* Slide counter dots */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {slides.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === current ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        </div>

        {/* Caption preview */}
        <div className="bg-white p-2">
          <p className="text-xs text-slate-700 line-clamp-2">שקופית {current + 1} מתוך {slides.length}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button size="sm" variant="outline" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm text-slate-500">{current + 1} / {slides.length}</span>
        <Button size="sm" variant="outline" onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))} disabled={current === slides.length - 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* All slides list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-full text-end p-3 rounded-lg border text-sm transition-colors ${i === current ? "border-brand-blue bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
          >
            <div className="font-medium text-slate-800">{s.headline}</div>
            <div className="text-slate-500 text-xs mt-0.5">{s.body}</div>
            {s.cta && <div className="text-brand-blue text-xs mt-1 font-medium">{s.cta}</div>}
          </button>
        ))}
      </div>

      <Button size="sm" variant="outline" className="w-full" onClick={() => {
        const text = slides.map(s => `שקופית ${s.slide}:\n${s.headline}\n${s.body}${s.cta ? `\n${s.cta}` : ""}`).join("\n\n");
        void navigator.clipboard.writeText(text);
        toast.success("כל שקופיות הקרוסלה הועתקו!");
      }}>
        העתק את כל הקרוסלה
      </Button>
    </div>
  );
}

export function PhotoReview({ listingId, submissions }: { listingId: string; submissions: Submission[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("instagram");
  const [approvedPhotos, setApprovedPhotos] = useState<string[]>([]);

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
      setApprovedPhotos(submission.photos);
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
    { key: "instagram", label: "📸 Instagram" },
    { key: "carousel", label: "🎠 קרוסלה" },
    { key: "facebook", label: "👍 Facebook" },
    { key: "yad2", label: "🏠 יד2" },
    { key: "madlan", label: "🏡 מדלן" },
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
              {sub.status === "approved" ? "מאושר" : sub.status === "rejected" ? "נדחה" : "ממתין לאישור"}
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
              <Button size="sm" onClick={() => handleApprove(sub)} disabled={!!loading}>
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
            קמפיין שיווקי מלא נוצר
          </div>

          <div className="flex gap-1 flex-wrap border-b pb-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "instagram" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">כיתוב</label>
                <p className="text-sm whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{campaign.instagram_caption}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">האשטגים</label>
                <p className="text-sm text-brand-blue">{campaign.instagram_hashtags?.map(h => `#${h}`).join(" ")}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                void navigator.clipboard.writeText(campaign.instagram_caption + "\n\n" + campaign.instagram_hashtags?.map(h => `#${h}`).join(" "));
                toast.success("הועתק!");
              }}>
                העתק לאינסטגרם
              </Button>
            </div>
          )}

          {activeTab === "carousel" && (
            <CarouselPreview slides={campaign.instagram_carousel ?? []} photos={approvedPhotos} />
          )}

          {activeTab === "facebook" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">פוסט</label>
                <p className="text-sm whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{campaign.facebook_post}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-500 block mb-1">כותרת מודעה</label>
                  <p className="text-sm font-semibold">{campaign.facebook_ad_headline}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-500 block mb-1">גוף מודעה</label>
                  <p className="text-sm">{campaign.facebook_ad_body}</p>
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
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-500 block mb-1">כותרת</label>
                <p className="text-sm font-semibold">{campaign.yad2_title}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">תיאור</label>
                <p className="text-sm whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{campaign.yad2_description}</p>
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
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-500 block mb-1">כותרת</label>
                <p className="text-sm font-semibold">{campaign.madlan_title}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">תיאור</label>
                <p className="text-sm whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{campaign.madlan_description}</p>
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
