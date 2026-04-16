"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface ListingFilters {
  search: string;
  propertyType: string;
  priceMin: string;
  priceMax: string;
  rooms: string;
  city: string;
  status: string;
}

const defaultFilters: ListingFilters = {
  search: "",
  propertyType: "",
  priceMin: "",
  priceMax: "",
  rooms: "",
  city: "",
  status: "",
};

interface Props {
  onFilter: (filters: ListingFilters) => void;
}

export function ListingFilters({ onFilter }: Props) {
  const [filters, setFilters] = useState<ListingFilters>(defaultFilters);

  function update(key: keyof ListingFilters, value: string) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label>חיפוש</Label>
          <Input
            placeholder="שם, עיר, שכונה..."
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>סוג נכס</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filters.propertyType}
            onChange={(e) => update("propertyType", e.target.value)}
          >
            <option value="">הכל</option>
            <option value="apartment">דירה</option>
            <option value="house">בית</option>
            <option value="penthouse">פנטהאוז</option>
            <option value="land">קרקע</option>
            <option value="commercial">מסחרי</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label>חדרים</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filters.rooms}
            onChange={(e) => update("rooms", e.target.value)}
          >
            <option value="">כל החדרים</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5+</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label>סטטוס</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filters.status}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="">כל הסטטוסים</option>
            <option value="active">פעיל</option>
            <option value="sold">נמכר</option>
            <option value="rented">הושכר</option>
            <option value="inactive">לא פעיל</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label>עיר</Label>
          <Input
            placeholder="שם עיר..."
            value={filters.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>מחיר מינימום</Label>
          <Input
            type="number"
            placeholder="0"
            value={filters.priceMin}
            onChange={(e) => update("priceMin", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>מחיר מקסימום</Label>
          <Input
            type="number"
            placeholder="ללא הגבלה"
            value={filters.priceMax}
            onChange={(e) => update("priceMax", e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button variant="outline" className="w-full" onClick={reset}>
            נקה פילטרים
          </Button>
        </div>
      </div>
    </div>
  );
}
