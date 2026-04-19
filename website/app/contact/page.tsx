import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Phone, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="bg-navy-900 min-h-screen">
      <Nav />
      <div className="pt-32 pb-24">
        <div className="section-padding">
          <div className="text-center mb-14">
            <div className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">צרו קשר</div>
            <h1 className="text-5xl font-bold text-white">נשמח <span className="text-gradient">לעזור</span></h1>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="glass rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">שלחו לנו הודעה</h2>
              <form className="space-y-4">
                <div><label className="text-white/60 text-sm mb-1.5 block">שם מלא</label>
                  <input placeholder="ישראל ישראלי" className="w-full bg-white/8 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/60 transition-all" /></div>
                <div><label className="text-white/60 text-sm mb-1.5 block">טלפון</label>
                  <input placeholder="050-000-0000" className="w-full bg-white/8 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/60 transition-all ltr" /></div>
                <div><label className="text-white/60 text-sm mb-1.5 block">הודעה</label>
                  <textarea rows={4} placeholder="ספרו לנו מה אתם מחפשים..." className="w-full bg-white/8 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand/60 transition-all resize-none" /></div>
                <button type="submit" className="w-full bg-brand hover:bg-brand-400 text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-glow">שלחו הודעה</button>
              </form>
            </div>
            <div className="space-y-6">
              {[
                { icon: Phone, label: "טלפון", value: "+972-XX-XXX-XXXX", ltr: true },
                { icon: Mail, label: "אימייל", value: "info@spectra-nadlan.co.il", ltr: false },
                { icon: MapPin, label: "כתובת", value: "אריאל, שומרון", ltr: false },
              ].map(c => (
                <div key={c.label} className="glass rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center"><c.icon className="h-5 w-5 text-brand" /></div>
                  <div><div className="text-white/50 text-xs mb-1">{c.label}</div>
                    <div className={`text-white font-medium ${c.ltr ? "ltr" : ""}`}>{c.value}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
