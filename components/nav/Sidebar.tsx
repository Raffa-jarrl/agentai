"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Home, Users, Sparkles, BarChart3, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/(auth)/actions";

const items = [
  { href: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/listings", label: "נכסים", icon: Home },
  { href: "/leads", label: "לידים", icon: Users },
  { href: "/content", label: "תוכן", icon: Sparkles },
  { href: "/reports", label: "דוחות", icon: BarChart3 },
];

export function Sidebar({ agentName }: { agentName: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:flex-col w-60 border-l bg-card p-4 gap-1">
      <div className="px-3 py-4 border-b mb-2">
        <div className="text-lg font-bold text-brand">AgentAI</div>
        <div className="text-xs text-muted-foreground truncate">{agentName}</div>
      </div>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-brand text-white" : "text-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
      <form action={logoutAction} className="mt-auto">
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
          <LogOut className="h-4 w-4" />
          <span>יציאה</span>
        </button>
      </form>
    </aside>
  );
}
