import Link from "next/link";
import { ArrowLeft, Star, CheckCircle2, TrendingUp, Users, Award } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { PropertyCard } from "@/components/PropertyCard";
import { Footer } from "@/components/Footer";
import { supabaseAdmin as supabase } from "@/lib/supabase";

async function getFeaturedListings() {
  const { data } = await supabase
    .from("listings")
    .select("id, title, city, neighborhood, price, rooms, size_sqm, status, photos, property_type, description, floor, address")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

const neighborhoods = [
  { name: "אריאל", desc: "עיר הפריחה של שומרון — אוניברסיטה, קניון, ושכונות חדשות", img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80", count: 120 },
  { name: "נווה צוף", desc: "יישוב שקט ומבוקש עם בתים גדולים ונוף מדהים", img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80", count: 45 },
  { name: "קרני שומרון", desc: "קהילה ותיקה ומבוססת עם תשתיות מצוינות", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80", count: 67 },
];

const testimonials = [
  { name: "דוד ורחל כהן", text: "ספקטרה מצאו לנו בית חלומות באריאל תוך שלושה שבועות. מקצוענות ברמה אחרת!", rating: 5, type: "רוכשים" },
  { name: "משפחת לוי", text: "השירות היה מעל ומעבר. ליוו אותנו בכל שלב ונתנו תחושה שאנחנו הלקוח היחיד.", rating: 5, type: "שוכרים" },
  { name: "יוסי אברהם", text: "מכרתי דירה דרך ספקטרה במחיר הטוב ביותר בשוק. ממליץ בחום!", rating: 5, type: "מוכר" },
];

const stats = [
  { icon: TrendingUp, value: "₪2.5B+", label: "שווי עסקאות", color: "text-brand" },
  { icon: Users,      value: "1,200+", label: "לקוחות מרוצים", color: "text-gold" },
  { icon: Award,      value: "#1",     label: "בשומרון", color: "text-brand" },
];

export default async function HomePage() {
  const listings = await getFeaturedListings();

  return (
    <main className="bg-navy-900 min-h-screen">
      <Nav />
      <Hero />

      {/* Stats bar */}
      <section className="relative z-10 -mt-1 bg-navy-800/80 border-y border-white/8 backdrop-blur-sm">
        <div className="section-padding py-6">
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-white/10">
            {stats.map(s => (
              <div key={s.label} className="flex items-center justify-center gap-4 px-6">
                <s.icon className={`h-8 w-8 ${s.color} flex-shrink-0 hidden sm:block`} />
                <div className="text-center sm:text-right">
                  <div className={`text-2xl font-bold ${s.color} ltr`}>{s.value}</div>
                  <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="py-24">
        <div className="section-padding">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-brand text-sm font-semibold uppercase tracking-widest mb-2">נכסים נבחרים</div>
              <h2 className="text-4xl font-bold text-white">הנכסים <span className="text-gradient">החמים ביותר</span></h2>
            </div>
            <Link href="/listings"
              className="hidden sm:flex items-center gap-2 text-brand hover:text-brand-400 font-medium transition-colors group">
              כל הנכסים
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((l, i) => (
                <PropertyCard key={l.id} listing={l as never} featured={i === 0} />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-navy-700/50 rounded-2xl overflow-hidden border border-white/8">
                  <div className="aspect-[4/3] bg-navy-600/50 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-navy-600/50 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-navy-600/50 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link href="/listings" className="bg-brand text-white px-8 py-3 rounded-xl font-semibold hover:shadow-glow transition-all">
              כל הנכסים
            </Link>
          </div>
        </div>
      </section>

      {/* Neighborhoods */}
      <section className="py-24 bg-navy-800/40">
        <div className="section-padding">
          <div className="text-center mb-12">
            <div className="text-brand text-sm font-semibold uppercase tracking-widest mb-2">גלו את השכונות</div>
            <h2 className="text-4xl font-bold text-white">הפנינים של <span className="text-gradient">שומרון</span></h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {neighborhoods.map(n => (
              <Link key={n.name} href={`/listings?city=${n.name}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer">
                <img src={n.img} alt={n.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" />
                <div className="absolute bottom-0 right-0 p-6 w-full">
                  <div className="text-brand text-xs font-medium mb-1">{n.count} נכסים</div>
                  <h3 className="text-white text-2xl font-bold">{n.name}</h3>
                  <p className="text-white/60 text-sm mt-1 leading-snug">{n.desc}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-brand text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    ראו נכסים
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Spectra */}
      <section className="py-24">
        <div className="section-padding">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">למה ספקטרה?</div>
              <h2 className="text-4xl font-bold text-white leading-tight mb-6">
                הניסיון המקומי<br />שלא ניתן לקנות
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                אנחנו לא סתם מתווכים — אנחנו חלק מהקהילה. מכירים כל רחוב, כל שכונה, כל נכס.
                זה מה שמאפשר לנו למצוא לכם את הבית הנכון — לא רק מבחינת תקציב, אלא מבחינת חיים.
              </p>
              <ul className="space-y-4">
                {[
                  "ליווי אישי מהחיפוש ועד מסירת המפתח",
                  "שקיפות מלאה — ללא עמלות מוסתרות",
                  "מומחיות בנדל״ן שומרון — 12 שנות ניסיון",
                  "טכנולוגיה מתקדמת — CRM AI + התראות בזמן אמת",
                ].map(t => (
                  <li key={t} className="flex items-start gap-3 text-white/70">
                    <CheckCircle2 className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Link href="/about" className="inline-flex items-center gap-2 mt-8 bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand px-6 py-3 rounded-xl font-semibold transition-all">
                קראו עלינו
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden aspect-square">
                <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700&q=85" alt="צוות ספקטרה" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 glass p-5 rounded-2xl shadow-glow-lg max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  {Array.from({length:5}).map((_,i) => <Star key={i} className="h-4 w-4 text-gold fill-gold" />)}
                </div>
                <p className="text-white/80 text-sm">"הצוות הטוב ביותר שעבדנו איתו. פשוט מדהים!"</p>
                <p className="text-white/40 text-xs mt-2">— משפחת שמש, אריאל</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-navy-800/40">
        <div className="section-padding">
          <div className="text-center mb-12">
            <div className="text-brand text-sm font-semibold uppercase tracking-widest mb-2">מה אומרים הלקוחות</div>
            <h2 className="text-4xl font-bold text-white">הסיפורים <span className="text-gradient">שלהם</span></h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="glass p-6 rounded-2xl hover:border-brand/30 transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({length:t.rating}).map((_,i) => <Star key={i} className="h-4 w-4 text-gold fill-gold" />)}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3 border-t border-white/8 pt-4">
                  <div className="w-9 h-9 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{t.name}</div>
                    <div className="text-white/40 text-xs">{t.type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24">
        <div className="section-padding">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand/20 to-navy-700 border border-brand/20 p-12 text-center">
            <div className="absolute inset-0 bg-gradient-radial from-brand/10 via-transparent to-transparent" />
            <div className="relative">
              <h2 className="text-4xl font-bold text-white mb-4">מוכנים למצוא את הבית שלכם?</h2>
              <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">צרו קשר עכשיו ונמצא לכם את הנכס המושלם בשומרון</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/listings" className="bg-brand hover:bg-brand-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-glow-lg">
                  חפשו נכסים
                </Link>
                <Link href="/contact" className="glass border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:border-brand/40">
                  דברו איתנו
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
