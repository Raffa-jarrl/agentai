"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/listings?type=sale",   label: "למכירה" },
  { href: "/listings?type=rent",   label: "להשכרה" },
  { href: "/listings?type=commercial", label: "מסחרי" },
  { href: "/neighborhoods",        label: "שכונות" },
  { href: "/about",                label: "עלינו" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 inset-x-0 z-50 transition-all duration-500",
      scrolled ? "glass-dark shadow-xl" : "bg-transparent",
    )}>
      <div className="section-padding">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <div className="text-white font-bold text-xl leading-none">ספקטרה</div>
              <div className="text-brand text-xs font-medium tracking-widest uppercase">NADLAN</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="tel:+972XXXXXXXX" className="flex items-center gap-2 text-sm text-white/70 hover:text-brand transition-colors">
              <Phone className="h-4 w-4" />
              <span className="ltr">+972-XX-XXX-XXXX</span>
            </a>
            <Link href="/contact"
              className="bg-brand hover:bg-brand-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-glow">
              צרו קשר
            </Link>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-white p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-dark border-t border-white/10 px-4 py-6 space-y-2">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all">
              {l.label}
            </Link>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)}
            className="block mt-4 bg-brand text-white text-center px-4 py-3 rounded-xl font-semibold">
            צרו קשר
          </Link>
        </div>
      )}
    </header>
  );
}
