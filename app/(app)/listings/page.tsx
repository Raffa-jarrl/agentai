import Link from "next/link";
import Image from "next/image";
import { Plus, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatILS } from "@/lib/formatters/currency";

const statusLabels: Record<string, string> = {
  active: "פעיל",
  sold: "נמכר",
  rented: "הושכר",
  inactive: "לא פעיל",
};

export default async function ListingsPage() {
  const supabase = createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, city, neighborhood, price, rooms, size_sqm, status, photos, property_type")
    .order("created_at", { ascending: false });

  // Match counts per listing
  const ids = (listings ?? []).map((l) => l.id);
  let counts: Record<string, number> = {};
  if (ids.length) {
    const { data: matches } = await supabase
      .from("lead_listing_matches")
      .select("listing_id")
      .in("listing_id", ids);
    counts = (matches ?? []).reduce<Record<string, number>>((acc, m) => {
      acc[m.listing_id] = (acc[m.listing_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">הנכסים שלי</h1>
        <Button asChild>
          <Link href="/listings/new"><Plus className="h-4 w-4" /> נכס חדש</Link>
        </Button>
      </header>

      {!listings?.length ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Home className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">עדיין אין לך נכסים</p>
          <Button asChild><Link href="/listings/new">הוסף נכס ראשון</Link></Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <Link key={l.id} href={`/listings/${l.id}`} className="block border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
              <div className="relative aspect-[4/3] bg-muted">
                {l.photos?.[0] ? (
                  <Image src={l.photos[0]} alt={l.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">ללא תמונה</div>
                )}
                <Badge variant="secondary" className="absolute top-2 right-2">{statusLabels[l.status]}</Badge>
                {counts[l.id] ? (
                  <Badge variant="teal" className="absolute bottom-2 right-2">{counts[l.id]} לידים מתאימים</Badge>
                ) : null}
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-semibold truncate">{l.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{l.city}{l.neighborhood ? ` · ${l.neighborhood}` : ""}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm">{l.rooms ? `${l.rooms} חד׳` : ""}{l.size_sqm ? ` · ${l.size_sqm} מ״ר` : ""}</span>
                  <span className="font-bold text-brand ltr">{formatILS(l.price)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
