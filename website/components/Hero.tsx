"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Home, Building2, Key } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "sale",       label: "למכירה",   icon: Home },
  { id: "rent",       label: "להשכרה",   icon: Key },
  { id: "commercial", label: "מסחרי",    icon: Building2 },
];

const trending = ["אריאל", "נווה צוף", "אופרה", "שערי תקווה", "קרני שומרון"];

export function Hero() {
  const router = useRouter();
  const [tab, setTab] = useState("sale");
  const [query, setQuery] = useState("");

  function search() {
    const params = new URLSearchParams({ type: tab });
    if (query) params.set("q", query);
    router.push("/listings?" + params.toString());
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1920&q=85"
          alt="נכס יוקרה"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/30 via-transparent to-navy-900/90" />
      </div>

      {/* Floating accent */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand/20 rounded-full blur-3xl animate-float pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 section-padding w-full text-center pt-32 pb-24">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-brand font-medium mb-6">
            <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
            מעל 500 נכסים בשומרון
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4">
            מצאו את<br />
            <span className="text-gradient">הבית שלכם</span><br />
            בשומרון
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-xl mx-auto mb-10">
            ספקטרה נדלן — המומחים הגדולים ביותר לנדל״ן בשומרון. ניסיון של שנים, שקיפות מלאה.
          </p>
        </div>

        {/* Search box */}
        <div className="animate-fade-up max-w-2xl mx-auto">
          <div className="glass rounded-2xl p-2">
            {/* Tabs */}
            <div className="flex gap-1 mb-3 p-1 bg-white/5 rounded-xl">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200",
                    tab === t.id
                      ? "bg-brand text-white shadow-glow"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}>
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute top-1/2 -translate-y-1/2 right-4 h-5 w-5 text-white/40" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && search()}
                  placeholder="חפשו עיר, שכונה, כתובת..."
                  className="w-full bg-white/10 border border-white/10 text-white placeholder-white/40 rounded-xl py-3.5 pr-12 pl-4 text-sm focus:outline-none focus:border-brand/60 focus:bg-white/15 transition-all"
                />
              </div>
              <button onClick={search}
                className="bg-brand hover:bg-brand-400 text-white px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-glow whitespace-nowrap">
                <Search className="h-5 w-5" />
                חיפוש
              </button>
            </div>

            {/* Trending */}
            <div className="flex items-center gap-2 flex-wrap mt-3 px-1">
              <span className="text-white/40 text-xs">חם:</span>
              {trending.map(t => (
                <button key={t} onClick={() => { setQuery(t); }}
                  className="text-xs text-white/60 hover:text-brand transition-colors bg-white/5 hover:bg-brand/10 px-3 py-1 rounded-full border border-white/10 hover:border-brand/30">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="animate-fade-up mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { n: "500+", label: "נכסים פעילים" },
            { n: "12+", label: "שנות ניסיון" },
            { n: "98%", label: "שביעות רצון" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-gradient">{s.n}</div>
              <div className="text-white/50 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 animate-bounce">
        <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        <span className="text-xs">גלול למטה</span>
      </div>
    </section>
  );
}
