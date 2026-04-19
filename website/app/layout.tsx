import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ספקטרה נדלן — הנדל״ן הטוב ביותר בשומרון",
  description: "מצאו את הבית המושלם שלכם בשומרון. דירות למכירה ולהשכרה, נכסים מסחריים ועוד.",
  openGraph: { title: "ספקטרה נדלן", description: "נדל״ן פרימיום בשומרון", locale: "he_IL" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body>{children}</body>
    </html>
  );
}
