import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatILS } from "@/lib/formatters/currency";
import { formatDate } from "@/lib/formatters/date";
import { MatchesPanel } from "@/components/listings/MatchesPanel";
import { PhotoReview } from "@/components/listings/PhotoReview";
import { CopyPhotographerLink } from "@/components/listings/CopyPhotographerLink";

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: listing } = await supabase.from("listings").select("*").eq("id", params.id).maybeSingle();
  if (!listing) notFound();

  const { data: matches } = await supabase
    .from("lead_listing_matches")
    .select("id, match_score, match_reasons, notification_sent, lead:leads(id, full_name, phone, score)")
    .eq("listing_id", listing.id)
    .order("match_score", { ascending: false });

  const { data: submissions } = await supabase
    .from("photo_submissions")
    .select("*")
    .eq("listing_id", params.id)
    .order("created_at", { ascending: false });

  const photographerLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/photographer/${listing.id}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <p className="text-muted-foreground">{listing.city}{listing.neighborhood ? ` · ${listing.neighborhood}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/listings">חזרה</Link></Button>
        </div>
      </div>

      {listing.photos?.length ? (
        <div className="grid grid-cols-3 gap-2">
          {(listing.photos as string[]).map((url: string, i: number) => (
            <div key={url} className={`relative rounded-md overflow-hidden ${i === 0 ? "col-span-3 md:col-span-2 md:row-span-2 aspect-[4/3]" : "aspect-square"}`}>
              <Image src={url} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="מחיר" value={formatILS(listing.price)} accent />
        <Stat label="חדרים" value={listing.rooms ?? "—"} />
        <Stat label="גודל" value={listing.size_sqm ? `${listing.size_sqm} מ״ר` : "—"} />
      </div>

      {listing.description && (
        <section>
          <h2 className="text-lg font-semibold mb-2">תיאור</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{listing.description}</p>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">לידים מתאימים ({matches?.length ?? 0})</h2>
        </div>
        <MatchesPanel listingId={listing.id} matches={(matches ?? []) as never} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <CopyPhotographerLink link={photographerLink} />
          <h2 className="text-lg font-semibold">תמונות מצלם</h2>
        </div>
        <PhotoReview listingId={params.id} submissions={submissions ?? []} />
      </section>

      <p className="text-xs text-muted-foreground">נוצר ב-{formatDate(listing.created_at)}</p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold mt-1 ${accent ? "text-brand ltr" : ""}`}>{value}</div>
    </div>
  );
}
