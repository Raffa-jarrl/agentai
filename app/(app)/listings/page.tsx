"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Home, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListingFilters, type ListingFilters as Filters } from "@/components/listings/ListingFilters";
import { formatILS } from "@/lib/formatters/currency";
import { createClient } from "@/lib/supabase/client";

const statusLabels: Record<string, string> = {
  active: "פעיל",
  sold: "נמכר",
  rented: "הושכר",
  inactive: "לא פעיל",
};

interface Listing {
  id: string;
  title: string;
  city: string;
  neighborhood: string | null;
  price: number;
  rooms: number | null;
  size_sqm: number | null;
  status: string;
  photos: string[];
  property_type: string;
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, title, city, neighborhood, price, rooms, size_sqm, status, photos, property_type")
        .order("created_at", { ascending: false });
      const all = (data ?? []) as Listing[];
      setListings(all);
      setFiltered(all);

      const ids = all.map((l) => l.id);
      if (ids.length) {
        const { data: matches } = await supabase
          .from("lead_listing_matches")
          .select("listing_id")
          .in("listing_id", ids);
        const c = ((matches ?? []) as { listing_id: string }[]).reduce<Record<string, number>>((acc, m) => {
          acc[m.listing_id] = (acc[m.listing_id] ?? 0) + 1;
          return acc;
        }, {});
        setCounts(c);
      }
      setLoading(false);
    })();
  }, []);

  function handleFilter(f: Filters) {
    let result = listings;
    if (f.search) {
      const q = f.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          (l.neighborhood ?? "").toLowerCase().includes(q),
      );
    }
    if (f.propertyType) result = result.filter((l) => l.property_type === f.propertyType);
    if (f.status) result = result.filter((l) => l.status === f.status);
    if (f.city) result = result.filter((l) => l.city.toLowerCase().includes(f.city.toLowerCase()));
    if (f.rooms) {
      const r = parseInt(f.rooms);
      result = result.filter((l) => {
        if (r === 5) return (l.rooms ?? 0) >= 5;
        return l.rooms === r;
      });
    }
    if (f.priceMin) result = result.filter((l) => l.price >= parseInt(f.priceMin));
    if (f.priceMax) result = result.filter((l) => l.price <= parseInt(f.priceMax));
    setFiltered(result);
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-h2">הנכסים שלי</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/export/listings" download>
              <Download className="h-4 w-4 ml-1" />
              ייצוא CSV
            </a>
          </Button>
          <Button asChild>
            <Link href="/listings/new"><Plus className="h-4 w-4" /> נכס חדש</Link>
          </Button>
        </div>
      </header>

      <ListingFilters onFilter={handleFilter} />

      <p className="text-sm text-muted-foreground">
        מציג {filtered.length} מתוך {listings.length} נכסים
      </p>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">טוען...</div>
      ) : !filtered.length ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Home className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">לא נמצאו נכסים</p>
          <Button asChild><Link href="/listings/new">הוסף נכס ראשון</Link></Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((l) => (
            <Link
              key={l.id}
              href={`/listings/${l.id}`}
              className="block border border-border rounded-lg overflow-hidden bg-card hover:shadow-md-hover shadow-sm transition-all duration-200"
            >
              <div className="relative aspect-[4/3] bg-muted">
                {l.photos?.[0] ? (
                  <Image src={l.photos[0]} alt={l.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">ללא תמונה</div>
                )}
                <Badge variant="secondary" className="absolute top-3 right-3">{statusLabels[l.status]}</Badge>
                {counts[l.id] ? (
                  <Badge variant="teal" className="absolute bottom-3 right-3">{counts[l.id]} לידים מתאימים</Badge>
                ) : null}
              </div>
              <div className="p-5 space-y-2">
                <h3 className="text-h3 truncate">{l.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{l.city}{l.neighborhood ? ` · ${l.neighborhood}` : ""}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{l.rooms ? `${l.rooms} חד׳` : ""}{l.size_sqm ? ` · ${l.size_sqm} מ״ר` : ""}</span>
                  <span className="text-lg font-bold text-brand ltr">{formatILS(l.price)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
