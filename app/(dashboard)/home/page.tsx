"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Receipt, CalendarDays, Wand2, MapPin, ChevronRight, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { LoadingPlane } from "@/components/ui/LoadingPlane";
import { useExpenses } from "@/lib/hooks/useExpenses";
import { useSchedule } from "@/lib/hooks/useSchedule";
import { useMembers } from "@/lib/hooks/useMembers";
import { formatKrw, formatMyr } from "@/lib/utils/currency";
import { isToday, parseISO, format, differenceInDays } from "date-fns";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const TRIP_START = new Date("2026-05-08");

const QUICK_LINKS = [
  { href: "/expenses", label: "记账",   icon: Receipt,      bg: "bg-emerald-50",  ic: "text-emerald-600" },
  { href: "/schedule", label: "行程",   icon: CalendarDays, bg: "bg-violet-50",   ic: "text-violet-600" },
  { href: "/ai-tools", label: "AI工具", icon: Wand2,        bg: "bg-amber-50",    ic: "text-amber-600" },
  { href: "/map",      label: "地图",   icon: MapPin,       bg: "bg-sky-50",      ic: "text-sky-600" },
];

const CAT_EMOJI: Record<string, string> = {
  food: "🍜", transport: "🚇", shopping: "🛍️",
  accommodation: "🏨", entertainment: "🎡", health: "💊", other: "💳",
};

export default function HomePage() {
  const { data: expenses = [], isLoading: expLoading } = useExpenses(TRIP_ID);
  const { data: activities = [], isLoading: actLoading } = useSchedule(TRIP_ID);
  const { data: members = [] } = useMembers();

  const [userName, setUserName]   = useState("");
  const [userEmoji, setUserEmoji] = useState("✈️");

  useEffect(() => {
    setUserName(localStorage.getItem("seoulmate_user_name") ?? "旅行者");
    setUserEmoji(localStorage.getItem("seoulmate_user_emoji") ?? "✈️");
  }, []);

  const totalKrw = expenses.reduce((s, e) => s + e.amount_krw, 0);
  const totalMyr = expenses.reduce((s, e) => s + (e.amount_myr ?? 0), 0);

  const todayActivities = activities.filter((a) => isToday(parseISO(a.activity_date)));
  const recentExpenses  = expenses.slice(0, 3);
  const today           = format(new Date(), "EEEE, d MMM");

  const daysLeft = differenceInDays(TRIP_START, new Date());

  if (expLoading && actLoading) return <LoadingPlane text="正在载入..." />;

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      {/* Header */}
      <div className="bg-surface px-5 pt-safe pb-4 border-b border-neutral-100">
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-xs text-neutral-400 font-medium">{today}</p>
            <h1 className="text-2xl font-black text-gray-900 mt-0.5">
              嗨，{userName}！{userEmoji}
            </h1>
            <p className="text-sm text-neutral-500">首尔，韩国 🇰🇷</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-forest to-forest-mid flex items-center justify-center text-xl shadow-sm">
              {userEmoji}
            </div>
            {daysLeft > 0 && (
              <span className="text-[10px] font-bold text-forest bg-forest-mist rounded-full px-2 py-0.5">
                {daysLeft}天后出发
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5 pb-safe">
        {/* Spend card */}
        <div className="rounded-3xl bg-forest px-5 py-4 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-forest-light/50" />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-forest-light/40" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-forest-pale text-xs font-semibold uppercase tracking-widest">旅游总支出</p>
              <div className="flex items-center gap-1 bg-forest-light/50 rounded-full px-2.5 py-1">
                <TrendingUp className="h-3 w-3 text-forest-soft" />
                <span className="text-forest-soft text-xs font-bold">{expenses.length} 笔</span>
              </div>
            </div>
            <p className="text-4xl font-black text-white tracking-tight">{formatKrw(totalKrw)}</p>
            {totalMyr > 0 && (
              <p className="text-forest-pale text-sm mt-1">≈ {formatMyr(totalMyr)} MYR</p>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_LINKS.map(({ href, label, icon: Icon, bg, ic }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-2 tap-target">
              <div className={`rounded-2xl p-3.5 ${bg} w-full flex justify-center`}>
                <Icon className={`h-5 w-5 ${ic}`} />
              </div>
              <span className="text-[10px] font-semibold text-neutral-500 text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>

        {/* Members */}
        {members.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="section-title flex items-center gap-2">
                <Users className="h-4 w-4 text-neutral-400" /> 旅行团
              </h2>
              <Link href="/intro" className="text-xs text-forest font-semibold">管理</Link>
            </div>
            <Card className="flex items-center gap-2 py-3">
              {members.map((m) => (
                <div key={m.id} className="flex flex-col items-center gap-1">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-lg`}>
                    {m.emoji}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-medium">{m.name}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Weather */}
        <div>
          <h2 className="section-title mb-2.5">首尔天气</h2>
          <WeatherWidget />
        </div>

        {/* Today's plan */}
        {todayActivities.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="section-title">今日行程</h2>
              <Link href="/schedule" className="text-xs text-forest font-semibold flex items-center gap-0.5">
                全部 <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {todayActivities.slice(0, 3).map((act) => (
                <Card key={act.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-forest-mist flex items-center justify-center shrink-0">
                    <CalendarDays className="h-5 w-5 text-forest-mid" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{act.title}</p>
                    {act.start_time && (
                      <p className="text-xs text-neutral-400">
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
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="section-title">近期支出</h2>
              <Link href="/expenses" className="text-xs text-forest font-semibold flex items-center gap-0.5">
                全部 <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentExpenses.map((exp) => (
                <Card key={exp.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-neutral-100 flex items-center justify-center text-lg shrink-0">
                      {CAT_EMOJI[exp.category ?? "other"] ?? "💳"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{exp.title}</p>
                      <p className="text-xs text-neutral-400">{exp.expense_date}</p>
                    </div>
                  </div>
                  <span className="currency-krw whitespace-nowrap">₩{exp.amount_krw.toLocaleString("ko-KR")}</span>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {expenses.length === 0 && activities.length === 0 && (
          <Card className="text-center py-10">
            <div className="text-5xl mb-3">🇰🇷</div>
            <p className="font-bold text-gray-800 text-lg">欢迎使用 SeoulMate！</p>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
              开始规划你的首尔之旅吧<br />添加行程或记录消费
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Link href="/schedule" className="btn-primary text-sm">
                <CalendarDays className="h-4 w-4" /> 规划行程
              </Link>
              <Link href="/expenses" className="btn-secondary text-sm">
                <Receipt className="h-4 w-4" /> 记录消费
              </Link>
            </div>
          </Card>
        )}

        {/* Korean phrase */}
        <div className="rounded-2xl bg-surface shadow-card border border-forest-pale/60 p-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🗣️</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">每日韩语</p>
              <p className="text-2xl font-black text-forest mt-0.5">감사합니다</p>
              <p className="text-xs text-neutral-400">Gamsahamnida · 谢谢你</p>
            </div>
            <Link href="/ai-tools" className="shrink-0 bg-forest-mist rounded-xl px-3 py-2 text-xs font-bold text-forest">
              更多 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
