"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface AgentProfile {
  id: string;
  full_name: string;
  phone: string | null;
  business_name: string | null;
  whatsapp_business_number: string | null;
  email: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/settings/profile")
      .then((r) => r.json())
      .then((d: AgentProfile) => {
        setProfile(d);
        setFullName(d.full_name ?? "");
        setPhone(d.phone ?? "");
        setBusinessName(d.business_name ?? "");
        setWhatsapp(d.whatsapp_business_number ?? "");
      })
      .catch(() => toast.error("שגיאה בטעינת הפרופיל"));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        phone,
        business_name: businessName,
        whatsapp_business_number: whatsapp,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("הפרופיל נשמר בהצלחה");
    } else {
      const d = await res.json() as { error?: string };
      toast.error(d.error ?? "שגיאה בשמירה");
    }
  }

  const photographerLink = profile
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/photo/${profile.id}`
    : "";

  function copyLink() {
    navigator.clipboard.writeText(photographerLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">הגדרות</h1>
        <p className="text-muted-foreground text-sm">ניהול הפרופיל והחשבון שלך</p>
      </header>

      <Card>
        <CardHeader><CardTitle>פרופיל אישי</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-1">
              <Label>שם מלא</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ישראל ישראלי" />
            </div>
            <div className="space-y-1">
              <Label>טלפון</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-0000000" type="tel" className="ltr" />
            </div>
            <div className="space-y-1">
              <Label>שם עסק</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="סוכנות נדלן..." />
            </div>
            <div className="space-y-1">
              <Label>מספר WhatsApp עסקי</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="972501234567" className="ltr" />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "שומר..." : "שמור שינויים"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>הגדרות תצוגה</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">שפה</p>
              <p className="text-xs text-muted-foreground">עברית</p>
            </div>
            <span className="text-xs text-muted-foreground border rounded px-2 py-1">עברית בלבד</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">אזור זמן</p>
              <p className="text-xs text-muted-foreground">ירושלים (UTC+2/+3)</p>
            </div>
            <span className="text-xs text-muted-foreground border rounded px-2 py-1">Asia/Jerusalem</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>קישור לצלם</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">שלח קישור זה לצלם לצורך העלאת תמונות לנכסים שלך</p>
          <div className="flex gap-2">
            <Input value={photographerLink} readOnly className="ltr text-xs" />
            <Button variant="outline" onClick={copyLink}>
              {copied ? "הועתק!" : "העתק"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader><CardTitle className="text-destructive">מחיקת חשבון</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">מחיקת חשבון היא פעולה בלתי הפיכה. כל הנתונים יימחקו.</p>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => toast.info("למחיקת חשבון, פנה לתמיכה בכתובת support@agentai.co.il")}
          >
            מחק חשבון
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
