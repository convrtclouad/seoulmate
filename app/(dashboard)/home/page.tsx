"use client";

import Link from "next/link";
import {
  Receipt, CalendarDays, Wand2, MapPin,
  ChevronRight, Flame, Star,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { useExpenses } from "@/lib/hooks/useExpenses";
import { useSchedule } from "@/lib/hooks/useSchedule";
import { formatKrw, formatMyr } from "@/lib/utils/currency";
import { isToday, parseISO, format } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const CURRENT_USER = {
  id:           "user-1",
  display_name: "Bryan",
  avatar_url:   null,
  phone:        null,
  last_lat:     null,
  last_lng:     null,
  last_checkin: null,
  created_at:   "",
  updated_at:   "",
};

const QUICK_LINKS = [
  { href: "/expenses", label: "Add Expense",  icon: Receipt,      color: "bg-pink-50 text-pink-500" },
  { href: "/schedule", label: "Schedule",     icon: CalendarDays, color: "bg-purple-50 text-purple-500" },
  { href: "/ai-tools", label: "AI Tools",     icon: Wand2,        color: "bg-orange-50 text-orange-500" },
  { href: "/map",      label: "Map",          icon: MapPin,       color: "bg-blue-50 text-blue-500" },
];

export default function HomePage() {
  const { data: expenses = [] } = useExpenses(TRIP_ID);
  const { data: activities = [] } = useSchedule(TRIP_ID);

  const totalKrw = expenses.reduce((s, e) => s + e.amount_krw, 0);
  const totalMyr = expenses.reduce((s, e) => s + (e.amount_myr ?? 0), 0);

  const todaysActivities = activities.filter((a) =>
    isToday(parseISO(a.activity_date))
  );

  const recentExpenses = expenses.slice(0, 3);

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Hero header */}
      <div className="bg-korean-gradient px-5 pt-safe pb-6">
        <div className="flex items-center justify-between mt-3 mb-4">
          <div>
            <p className="text-white/70 text-sm">
              {format(new Date(), "EEEE, d MMMM")}
            </p>
            <h1 className="text-2xl font-black text-white">
              안녕하세요 👋
            </h1>
            <p className="text-white/80 text-sm">Seoul, South Korea</p>
          </div>
          <Avatar profile={CURRENT_USER} size="lg" />
        </div>

        {/* Spend summary */}
        <div className="rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-3">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
            Total Trip Spend
          </p>
          <p className="text-3xl font-black text-white mt-0.5">
            {formatKrw(totalKrw)}
          </p>
          {totalMyr > 0 && (
            <p className="text-white/70 text-sm">≈ {formatMyr(totalMyr)} MYR</p>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-6 pb-safe -mt-3">
        {/* Quick links */}
        <div className="grid grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1.5 tap-target"
            >
              <div className={`rounded-2xl p-3.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold text-gray-500 text-center leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* Weather */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Seoul Weather</h2>
          </div>
          <WeatherWidget />
        </div>

        {/* Today's activities */}
        {todaysActivities.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Today&apos;s Plan</h2>
              <Link href="/schedule" className="text-xs text-primary-500 font-semibold flex items-center gap-0.5">
                See all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {todaysActivities.slice(0, 3).map((act) => (
                <Card key={act.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <CalendarDays className="h-5 w-5 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{act.title}</p>
                    {act.start_time && (
                      <p className="text-xs text-gray-400">
                        {format(parseISO(`2000-01-01T${act.start_time}`), "h:mm a")}
                        {act.place_name && ` · ${act.place_name}`}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent expenses */}
        {recentExpenses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Recent Expenses</h2>
              <Link href="/expenses" className="text-xs text-primary-500 font-semibold flex items-center gap-0.5">
                See all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentExpenses.map((exp) => (
                <Card key={exp.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                      <Flame className="h-4 w-4 text-pink-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{exp.title}</p>
                      <p className="text-xs text-gray-400">{exp.expense_date}</p>
                    </div>
                  </div>
                  <span className="currency-krw whitespace-nowrap">
                    ₩{exp.amount_krw.toLocaleString("ko-KR")}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty hero */}
        {expenses.length === 0 && activities.length === 0 && (
          <Card className="text-center py-10">
            <div className="text-5xl mb-3">🇰🇷</div>
            <p className="font-bold text-gray-800 text-lg">Welcome to SeoulMate!</p>
            <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
              Start by adding your first activity or expense, then invite your travel buddies.
            </p>
            <div className="flex gap-3 justify-center mt-5">
              <Link href="/schedule" className="btn-primary text-sm">
                <CalendarDays className="h-4 w-4" />
                Plan Trip
              </Link>
              <Link href="/expenses" className="btn-secondary text-sm">
                <Receipt className="h-4 w-4" />
                Add Expense
              </Link>
            </div>
          </Card>
        )}

        {/* Korean phrases teaser */}
        <Card className="bg-gradient-to-r from-korean-red/5 to-primary-50 border border-primary-100">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🗣️</div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">Korean Phrase of the Day</p>
              <p className="text-xl font-black text-primary-500 mt-0.5">감사합니다</p>
              <p className="text-xs text-gray-400">Gamsahamnida · Thank you</p>
            </div>
            <Link href="/ai-tools" className="shrink-0">
              <Star className="h-5 w-5 text-korean-gold" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
