"use client";
import Link from "next/link";
import { Bed, Maximize2, MapPin, Heart } from "lucide-react";
import { cn, formatILS } from "@/lib/utils";
import type { Listing } from "@/lib/supabase";

const typeLabels: Record<string, string> = {
  apartment: "דירה", house: "בית", penthouse: "פנטהאוז",
  garden_apt: "דירת גן", duplex: "דופלקס", commercial: "מסחרי", land: "קרקע",
};
const statusColors: Record<string, string> = {
  active: "bg-brand/90 text-white",
  sold: "bg-red-500/90 text-white",
  rented: "bg-blue-500/90 text-white",
};
const statusLabels: Record<string, string> = { active: "פעיל", sold: "נמכר", rented: "הושכר" };

interface Props { listing: Listing; featured?: boolean; }

export function PropertyCard({ listing, featured }: Props) {
  const photo = listing.photos?.[0] ?? `https://picsum.photos/seed/${listing.id}/800/600`;

  return (
    <Link href={`/listings/${listing.id}`}
      className={cn(
        "group block bg-navy-700/50 border border-white/8 rounded-2xl overflow-hidden transition-all duration-300",
        "hover:border-brand/40 hover:shadow-card-hover hover:-translate-y-1",
        featured && "md:col-span-2",
      )}>
      {/* Image */}
      <div className={cn("relative overflow-hidden", featured ? "aspect-[16/9]" : "aspect-[4/3]")}>
        <img
          src={photo}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${listing.id}/800/600`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm", statusColors[listing.status] ?? "bg-white/20 text-white")}>
            {statusLabels[listing.status] ?? listing.status}
          </span>
          {listing.property_type && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-navy-900/70 text-white/80 backdrop-blur-sm border border-white/10">
              {typeLabels[listing.property_type] ?? listing.property_type}
            </span>
          )}
        </div>

        {/* Heart */}
        <button onClick={e => e.preventDefault()}
          className="absolute top-3 left-3 w-8 h-8 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-red-400 text-white/70">
          <Heart className="h-4 w-4" />
        </button>

        {/* Price overlay */}
        <div className="absolute bottom-3 right-3">
          <div className="glass px-3 py-1.5 rounded-xl">
            <span className="text-white font-bold text-lg ltr">{formatILS(listing.price)}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-brand transition-colors">
            {listing.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-white/50 text-sm">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{listing.city}{listing.neighborhood ? ` · ${listing.neighborhood}` : ""}</span>
          </div>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 pt-2 border-t border-white/8">
          {listing.rooms && (
            <div className="flex items-center gap-1.5 text-white/60 text-sm">
              <Bed className="h-4 w-4" />
              <span>{listing.rooms} חד׳</span>
            </div>
          )}
          {listing.size_sqm && (
            <div className="flex items-center gap-1.5 text-white/60 text-sm">
              <Maximize2 className="h-4 w-4" />
              <span>{listing.size_sqm} מ״ר</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
