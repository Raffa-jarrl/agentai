import Link from "next/link";
import { Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-800 border-t border-white/8 mt-24">
      <div className="section-padding py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <div className="text-white font-bold text-xl">ספקטרה נדלן</div>
                <div className="text-brand text-xs tracking-widest">SPECTRA NADLAN</div>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              המומחים הגדולים ביותר לנדל״ן בשומרון. מלווים אתכם בכל שלב — מחיפוש הנכס ועד מסירת המפתח.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="#" className="w-9 h-9 rounded-xl glass flex items-center justify-center text-white/50 hover:text-brand hover:border-brand/30 transition-all">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl glass flex items-center justify-center text-white/50 hover:text-brand hover:border-brand/30 transition-all">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">נכסים</h4>
            <ul className="space-y-3 text-white/50 text-sm">
              {["דירות למכירה", "דירות להשכרה", "נכסים מסחריים", "קרקעות", "פנטהאוזים"].map(l => (
                <li key={l}><Link href="/listings" className="hover:text-brand transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">צרו קשר</h4>
            <ul className="space-y-3 text-white/50 text-sm">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand" /><span className="ltr">+972-XX-XXX-XXXX</span></li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand" /><span>info@spectra-nadlan.co.il</span></li>
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-brand flex-shrink-0 mt-0.5" /><span>אריאל, שומרון</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-xs">
          <p>© {new Date().getFullYear()} ספקטרה נדלן. כל הזכויות שמורות.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">פרטיות</Link>
            <Link href="#" className="hover:text-white transition-colors">תנאי שימוש</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
