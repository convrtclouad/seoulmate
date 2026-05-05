"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, BookMarked, Receipt, BookOpen, CheckSquare, Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/home",     label: "行程", icon: CalendarDays, color: "text-sage"        },
  { href: "/bookings", label: "预订", icon: BookMarked,   color: "text-ginger-500"  },
  { href: "/expenses", label: "记账", icon: Receipt,      color: "text-petal-400"   },
  { href: "/journal",  label: "日志", icon: BookOpen,     color: "text-lavender"    },
  { href: "/prepare",  label: "准备", icon: CheckSquare,  color: "text-mist-400"    },
  { href: "/wishlist", label: "打卡", icon: Heart,        color: "text-petal-400"   },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0)",
        background: "rgba(249,248,244,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-stretch h-[4.5rem] max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, color }) => {
          const active = pathname === href || (href !== "/home" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1",
                "transition-all duration-200 relative"
              )}
            >
              {active && (
                <span className="absolute top-2 inset-x-1 h-8 rounded-2xl"
                      style={{ background: "rgba(0,0,0,0.05)" }} />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 relative z-10 transition-transform duration-200",
                  active ? color : "text-ink-faint",
                  active && "scale-110"
                )}
                strokeWidth={active ? 2.2 : 1.6}
              />
              <span className={cn(
                "text-[9px] font-semibold tracking-wide relative z-10",
                active ? "text-ink" : "text-ink-faint"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
