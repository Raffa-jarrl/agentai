import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "AgentAI — מרכז השליטה של הסוכן",
  description: "פלטפורמת ניהול לידים, תוכן ותקשורת לסוכני נדל״ן בישראל",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable} suppressHydrationWarning>
      <body>
        {children}
        <Toaster position="top-center" richColors closeButton dir="rtl" />
      </body>
    </html>
  );
}
