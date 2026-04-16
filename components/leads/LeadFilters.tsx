"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface LeadFilters {
  search: string;
  score: string;
  status: string;
  source: string;
  budgetMin: string;
  budgetMax: string;
}

const defaultFilters: LeadFilters = {
  search: "",
  score: "",
  status: "",
  source: "",
  budgetMin: "",
  budgetMax: "",
};

const scoreOptions = [
  { value: "", label: "הכל" },
  { value: "hot", label: "חם", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "warm", label: "חמים", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "cold", label: "קר", color: "bg-blue-100 text-blue-700 border-blue-300" },
];

const statusOptions = [
  { value: "", label: "כל הסטטוסים" },
  { value: "new", label: "חדש" },
  { value: "contacted", label: "נוצר קשר" },
  { value: "qualified", label: "עבר סינון" },
  { value: "viewing_scheduled", label: "צפייה נקבעה" },
  { value: "negotiating", label: "משא ומתן" },
  { value: "closed_won", label: "נסגר ✓" },
  { value: "closed_lost", label: "נסגר ✗" },
  { value: "inactive", label: "לא פעיל" },
];

const sourceOptions = [
  { value: "", label: "כל המקורות" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "yad2", label: "יד2" },
  { value: "instagram", label: "Instagram" },
  { value: "website", label: "אתר" },
  { value: "referral", label: "הפניה" },
  { value: "manual", label: "ידני" },
  { value: "facebook", label: "Facebook" },
];

interface Props {
  onFilter: (filters: LeadFilters) => void;
}

export function LeadFilters({ onFilter }: Props) {
  const [filters, setFilters] = useState<LeadFilters>(defaultFilters);

  function update(key: keyof LeadFilters, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilter(next);
  }

  function reset() {
    setFilters(defaultFilters);
    onFilter(defaultFilters);
  }

  return (
    <div className="border rounded-lg p-4 bg-card space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>חיפוש</Label>
          <Input
            placeholder="שם, טלפון..."
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>מקור</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filters.source}
            onChange={(e) => update("source", e.target.value)}
          >
            {sourceOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>תקציב מינ׳</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.budgetMin}
              onChange={(e) => update("budgetMin", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>תקציב מקס׳</Label>
            <Input
              type="number"
              placeholder="ללא הגבלה"
              value={filters.budgetMax}
              onChange={(e) => update("budgetMax", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>ציון</Label>
        <div className="flex gap-2">
          {scoreOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => update("score", o.value)}
              className={cn(
                "px-3 py-1 rounded-full border text-xs font-medium transition-colors",
                filters.score === o.value
                  ? (o.color ?? "bg-primary text-primary-foreground border-primary")
                  : "bg-background border-input hover:bg-muted",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>סטטוס</Label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => update("status", o.value)}
              className={cn(
                "flex-shrink-0 px-3 py-1 rounded-full border text-xs font-medium transition-colors",
                filters.status === o.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-input hover:bg-muted",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={reset}>נקה</Button>
      </div>
    </div>
  );
}
