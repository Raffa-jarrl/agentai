import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, MapPin, Bed, Maximize2, Phone, Mail, CheckCircle2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { formatILS } from "@/lib/utils";

export default async function ListingPage({ params }: { params: { id: string } }) {
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!listing) notFound();

  const photos: string[] = listing.photos?.length
    ? listing.photos
    : [`https://picsum.photos/seed/${listing.id}/1200/800`];

  return (
    <main className="bg-navy-900 min-h-screen">
      <Nav />

      <div className="pt-24">
        {/* Hero image */}
        <div className="relative h-[55vh] overflow-hidden">
          <img src={photos[0]} alt={listing.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/20 to-transparent" />
        </div>

        <div className="section-padding py-12">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main */}
            <div className="lg:col-span-2">
              <Link href="/listings" className="flex items-center gap-2 text-white/50 hover:text-brand text-sm mb-6 transition-colors">
                <ArrowRight className="h-4 w-4" />
                חזרה לנכסים
              </Link>

              <h1 className="text-4xl font-bold text-white mb-3">{listing.title}</h1>
              <div className="flex items-center gap-2 text-white/50 mb-6">
                <MapPin className="h-4 w-4" />
                <span>{listing.city}{listing.neighborhood ? ` · ${listing.neighborhood}` : ""}</span>
              </div>

              {/* Specs */}
              <div className="flex flex-wrap gap-4 mb-8">
                {listing.rooms && (
                  <div className="glass px-4 py-3 rounded-xl flex items-center gap-2">
                    <Bed className="h-5 w-5 text-brand" />
                    <span className="text-white font-medium">{listing.rooms} חדרים</span>
                  </div>
                )}
                {listing.size_sqm && (
                  <div className="glass px-4 py-3 rounded-xl flex items-center gap-2">
                    <Maximize2 className="h-5 w-5 text-brand" />
                    <span className="text-white font-medium">{listing.size_sqm} מ״ר</span>
                  </div>
                )}
                {listing.floor != null && (
                  <div className="glass px-4 py-3 rounded-xl">
                    <span className="text-white font-medium">קומה {listing.floor}</span>
                  </div>
                )}
              </div>

              {listing.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-3">תיאור הנכס</h2>
                  <p className="text-white/60 leading-relaxed">{listing.description}</p>
                </div>
              )}

              {/* Photo gallery */}
              {photos.length > 1 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">גלריית תמונות</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.slice(1).map((p: string, i: number) => (
                      <div key={i} className="rounded-xl overflow-hidden aspect-[4/3]">
                        <img src={p} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price card */}
              <div className="glass rounded-2xl p-6">
                <div className="text-white/50 text-sm mb-1">מחיר</div>
                <div className="text-4xl font-bold text-gradient ltr mb-6">{formatILS(listing.price)}</div>
                <div className="space-y-3">
                  <a href="tel:+972XXXXXXXX"
                    className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-400 text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-glow">
                    <Phone className="h-5 w-5" />
                    התקשרו עכשיו
                  </a>
                  <Link href={`/contact?listing=${listing.id}`}
                    className="flex items-center justify-center gap-2 w-full glass border-white/20 hover:border-brand/40 text-white py-3.5 rounded-xl font-semibold transition-all">
                    <Mail className="h-5 w-5" />
                    שלחו הודעה
                  </Link>
                </div>
              </div>

              {/* Features */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">מה כלול</h3>
                <ul className="space-y-3">
                  {["חניה", "מחסן", "מרפסת", "מעלית", "ממ״ד"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-white/60 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-brand" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
