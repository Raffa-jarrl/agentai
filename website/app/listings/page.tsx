"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PropertyCard } from "@/components/PropertyCard";
import { Footer } from "@/components/Footer";
import type { Listing } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const typeOptions = [
  { value: "", label: "הכל" },
  { value: "apartment", label: "דירה" },
  { value: "house", label: "בית" },
  { value: "penthouse", label: "פנטהאוז" },
  { value: "commercial", label: "מסחרי" },
];
const roomOptions = ["הכל", "1", "2", "3", "4", "5+"];

function ListingsContent() {
  const params = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [propType, setPropType] = useState(params.get("type") === "rent" ? "" : "");
  const [rooms, setRooms] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      const typeParam = params.get("type");
      const url = `/api/listings${typeParam ? `?type=${typeParam}` : ""}`;
      const res = await fetch(url);
      const all: Listing[] = res.ok ? await res.json() : [];
      setListings(all);
      setFiltered(all);
      setLoading(false);
    })();
  }, [params]);

  useEffect(() => {
    let r = listings;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(l => l.title.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || (l.neighborhood ?? "").toLowerCase().includes(q));
    }
    if (propType) r = r.filter(l => l.property_type === propType);
    if (rooms && rooms !== "הכל") {
      const n = parseInt(rooms);
      r = r.filter(l => rooms === "5+" ? (l.rooms ?? 0) >= 5 : l.rooms === n);
    }
    setFiltered(r);
  }, [search, propType, rooms, listings]);

  return (
    <main className="bg-navy-900 min-h-screen">
      <Nav />

      {/* Page header */}
      <div className="pt-32 pb-12 bg-navy-800/60 border-b border-white/8">
        <div className="section-padding">
          <h1 className="text-4xl font-bold text-white mb-2">כל הנכסים</h1>
          <p className="text-white/50">מציג <span className="text-brand font-semibold">{filtered.length}</span> נכסים מתוך {listings.length}</p>

          {/* Search + filter bar */}
          <div className="flex gap-3 mt-6 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute top-1/2 -translate-y-1/2 right-4 h-4 w-4 text-white/40" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="חפשו עיר, שכונה, כתובת..."
                className="w-full bg-white/8 border border-white/10 text-white placeholder-white/40 rounded-xl py-3 pr-11 pl-4 text-sm focus:outline-none focus:border-brand/60 transition-all" />
              {search && <button onClick={() => setSearch("")} className="absolute top-1/2 -translate-y-1/2 left-3 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn("flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all", showFilters ? "bg-brand/20 border-brand/40 text-brand" : "bg-white/8 border-white/10 text-white/70 hover:border-white/20")}>
              <SlidersHorizontal className="h-4 w-4" />
              פילטרים
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/8 flex flex-wrap gap-6">
              <div>
                <div className="text-white/50 text-xs mb-2 font-medium">סוג נכס</div>
                <div className="flex gap-2 flex-wrap">
                  {typeOptions.map(o => (
                    <button key={o.value} onClick={() => setPropType(o.value)}
                      className={cn("px-3 py-1.5 rounded-lg text-sm transition-all", propType === o.value ? "bg-brand text-white" : "bg-white/8 text-white/60 hover:bg-white/15")}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-white/50 text-xs mb-2 font-medium">חדרים</div>
                <div className="flex gap-2">
                  {roomOptions.map(r => (
                    <button key={r} onClick={() => setRooms(r === "הכל" ? "" : r)}
                      className={cn("px-3 py-1.5 rounded-lg text-sm transition-all", rooms === r || (r === "הכל" && !rooms) ? "bg-brand text-white" : "bg-white/8 text-white/60 hover:bg-white/15")}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="section-padding py-12">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-navy-700/50 rounded-2xl overflow-hidden border border-white/8">
                <div className="aspect-[4/3] bg-navy-600/50 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-navy-600/50 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-navy-600/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">לא נמצאו נכסים</h3>
            <p className="text-white/50">נסו לשנות את פרמטרי החיפוש</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(l => <PropertyCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

export default function ListingsPage() {
  return (
    <Suspense>
      <ListingsContent />
    </Suspense>
  );
}
