"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Home, Users, Sparkles, BarChart3, LogOut, Calendar, Settings, Mic, PhoneCall, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/(auth)/actions";

const items = [
  { href: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/listings", label: "נכסים", icon: Home },
  { href: "/leads", label: "לידים", icon: Users },
  { href: "/viewings", label: "ביקורים", icon: Calendar },
  { href: "/content", label: "תוכן", icon: Sparkles },
  { href: "/reports", label: "דוחות", icon: BarChart3 },
];

export function Sidebar({ agentName }: { agentName: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:flex-col w-60 border-l border-border bg-card p-4 gap-2 shadow-sm">
      <div className="px-4 py-4 border-b border-border mb-2">
        <div className="text-lg font-bold text-brand">AgentAI</div>
        <div className="text-xs text-muted-foreground truncate mt-1">{agentName}</div>
      </div>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 font-medium",
              active ? "bg-brand text-white shadow-sm" : "text-foreground hover:bg-muted hover:shadow-xs",
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
      <div className="mt-auto pt-2 border-t border-border space-y-2">
        <Link
          href="/settings/pronunciations"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 font-medium",
            pathname === "/settings/pronunciations" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:shadow-xs",
          )}
        >
          <Mic className="h-5 w-5 flex-shrink-0" />
          <span>מילון הגייה</span>
        </Link>
        <Link
          href="/settings/call-stats"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 font-medium",
            pathname === "/settings/call-stats" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:shadow-xs",
          )}
        >
          <PhoneCall className="h-5 w-5 flex-shrink-0" />
          <span>סטטיסטיקת שיחות</span>
        </Link>
        <Link
          href="/settings/voice-test"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 font-medium",
            pathname === "/settings/voice-test" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:shadow-xs",
          )}
        >
          <Volume2 className="h-5 w-5 flex-shrink-0" />
          <span>השוואת קולות</span>
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 font-medium",
            pathname === "/settings" ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:shadow-xs",
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span>הגדרות</span>
        </Link>
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 hover:shadow-xs">
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>יציאה</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
