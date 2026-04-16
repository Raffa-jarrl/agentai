"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Home, Users, Calendar, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "בקרה", icon: LayoutDashboard },
  { href: "/listings", label: "נכסים", icon: Home },
  { href: "/leads", label: "לידים", icon: Users },
  { href: "/viewings", label: "ביקורים", icon: Calendar },
  { href: "/reports", label: "עוד", icon: Menu },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-card z-30">
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 text-xs gap-1",
                  active ? "text-brand" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
