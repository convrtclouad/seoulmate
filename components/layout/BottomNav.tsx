"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, CalendarDays, Wand2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/home",     label: "首页",   icon: Home },
  { href: "/expenses", label: "记账",   icon: Receipt },
  { href: "/schedule", label: "行程",   icon: CalendarDays },
  { href: "/ai-tools", label: "AI",     icon: Wand2 },
  { href: "/map",      label: "地图",   icon: MapPin },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/96 backdrop-blur-sm border-t border-neutral-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/home" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 tap-target transition-colors duration-150 relative",
                active ? "text-forest" : "text-neutral-400"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-150",
                  active && "scale-110"
                )}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={cn("text-[10px] font-medium", active ? "text-forest" : "text-neutral-400")}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-1 h-1 w-5 rounded-full bg-forest opacity-60" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
