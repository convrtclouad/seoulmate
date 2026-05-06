"use client";

import { useEffect, useState } from "react";
import { Plus, MapPin, Camera, Heart, ChevronRight } from "lucide-react";
import { tap } from "@/lib/utils/haptics";
import { useSchedule, useAddActivity, useDeleteActivity } from "@/lib/hooks/useSupabaseSchedule";
import { LoadingPlane } from "@/components/ui/LoadingPlane";
import { Modal } from "@/components/ui/Modal";
import { ActivityForm } from "@/components/schedule/ActivityForm";
import { format, parseISO, differenceInDays, addDays, isSameDay, isToday } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";

const TRIP_ID    = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const TRIP_START = new Date("2026-05-07");
const TRIP_END   = new Date("2026-05-15");

const TRIP_DAYS = Array.from(
  { length: differenceInDays(TRIP_END, TRIP_START) + 1 },
  (_, i) => addDays(TRIP_START, i)
);

const CAT_EMOJI: Record<string, string> = {
  transport: "🚇", food: "🍜", attraction: "🏯",
  accommodation: "🏨", shopping: "🛍️", other: "📌",
};
const CAT_COLOR: Record<string, string> = {
  transport:     "bg-ginger-100 text-ginger-500",
  food:          "bg-petal-100 text-petal-400",
  attraction:    "bg-sage-100 text-sage-600",
  accommodation: "bg-lavender-100 text-lavender-400",
  shopping:      "bg-mist-100 text-mist-400",
  other:         "bg-black/5 text-ink-muted",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return "夜深了";
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}

/* ── Dual timezone clock ── */
function DualClock() {
  const [klTime, setKL] = useState("");
  const [krTime, setKR] = useState("");

  useEffect(() => {
    function update() {
      const fmt = (tz: string) =>
        new Intl.DateTimeFormat("zh-CN", {
          timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
        }).format(new Date());
      setKL(fmt("Asia/Kuala_Lumpur"));
      setKR(fmt("Asia/Seoul"));
    }
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, []);

  if (!klTime) return null;
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="inline-flex items-center gap-1.5 rounded-2xl bg-surface px-3 py-1.5"
           style={{ boxShadow: "var(--shadow-card)" }}>
        <span className="text-xs">🇲🇾</span>
        <span className="text-xs font-bold text-ink-mid">KL {klTime}</span>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-2xl bg-surface px-3 py-1.5"
           style={{ boxShadow: "var(--shadow-card)" }}>
        <span className="text-xs">🇰🇷</span>
        <span className="text-xs font-bold text-ink-mid">首尔 {krTime}</span>
      </div>
    </div>
  );
}

/* ── Sangsu neighbourhood mini-map card ── */
function MapPreviewCard() {
  return (
    <Link href="/map" className="mx-4 mb-4 block rounded-3xl overflow-hidden relative active:scale-[0.98] transition-transform"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
      {/* Sky gradient background */}
      <div style={{ background: "linear-gradient(160deg, #B8D4F0 0%, #D4E8F8 40%, #E8F4E8 100%)", minHeight: 140 }}
           className="relative p-4">
        {/* Decorative buildings silhouette */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-2 opacity-20">
          {[32,48,28,56,36,42,26,50,30].map((h, i) => (
            <div key={i} style={{ height: h, width: 18, background: "#3A5D40", borderRadius: "4px 4px 0 0" }} />
          ))}
        </div>

        {/* Station pin */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="h-10 w-10 rounded-full bg-sage flex items-center justify-center shadow-lg"
               style={{ boxShadow: "0 4px 20px rgba(91,136,98,0.5)" }}>
            <span className="text-lg">🏠</span>
          </div>
          <div className="mt-1.5 bg-white rounded-xl px-2.5 py-1 shadow"
               style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            <p className="text-[10px] font-black text-ink">상수역 · 合水站</p>
          </div>
        </div>

        {/* Nearby dots */}
        <div className="absolute top-5 left-10 h-3 w-3 rounded-full bg-petal-400 shadow-sm opacity-70" title="홍대" />
        <div className="absolute top-8 right-12 h-3 w-3 rounded-full bg-ginger-400 shadow-sm opacity-70" title="신촌" />
        <div className="absolute bottom-10 left-16 h-2.5 w-2.5 rounded-full bg-lavender shadow-sm opacity-70" />

        {/* Top-right label */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-2xl px-2.5 py-1"
             style={{ boxShadow: "var(--shadow-card)" }}>
          <MapPin className="h-3 w-3 text-sage" />
          <span className="text-[10px] font-bold text-ink">上水洞 Sangsu</span>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-surface px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-ink">我们住在这里 🏠</p>
          <p className="text-[10px] text-ink-muted mt-0.5">연세로 2나길 · Yonsei-ro, Mapo-gu</p>
        </div>
        <div className="flex items-center gap-1 text-sage text-xs font-bold">
          查看地图 <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}

/* ── Malaysia return countdown bar ── */
function MalaysiaCountdown() {
  const now      = new Date();
  const daysBack = differenceInDays(TRIP_END, now);
  const inTrip   = now >= TRIP_START && now <= TRIP_END;
  const returned = now > TRIP_END;

  if (returned) return null;

  // Progress through trip (0–1)
  const tripLen  = differenceInDays(TRIP_END, TRIP_START);
  const elapsed  = Math.max(0, differenceInDays(now, TRIP_START));
  const progress = inTrip ? elapsed / tripLen : 0;

  return (
    <div className="mx-4 mb-4 rounded-3xl overflow-hidden"
         style={{ background: "linear-gradient(135deg, #2C3E6B 0%, #3D5A9A 100%)", boxShadow: "0 8px 28px rgba(44,62,107,0.25)" }}>
      <div className="px-5 py-3.5 flex items-center gap-4">
        <span className="text-2xl shrink-0">🇲🇾</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-white/80 text-xs font-semibold">
              {inTrip ? "还有多久回马来西亚" : "距离返程"}
            </p>
            <p className="text-white font-black text-lg leading-none">
              {daysBack > 0 ? `${daysBack} 天` : "今天回家！"}
            </p>
          </div>
          {inTrip && (
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white/70 transition-all duration-500"
                   style={{ width: `${progress * 100}%` }} />
            </div>
          )}
          <p className="text-white/50 text-[10px] mt-1">
            {format(TRIP_END, "M月d日")} 返回吉隆坡 ✈️
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: activities = [], isLoading } = useSchedule(TRIP_ID);
  const addActivity    = useAddActivity(TRIP_ID);
  const deleteActivity = useDeleteActivity(TRIP_ID);

  const [userName,    setUserName]    = useState("旅行者");
  const [userEmoji,   setUserEmoji]   = useState("🐻");
  const [selectedDay, setSelectedDay] = useState(TRIP_DAYS[0]);
  const [showForm,    setShowForm]    = useState(false);

  useEffect(() => {
    setUserName(localStorage.getItem("seoulmate_user_name") ?? "旅行者");
    setUserEmoji(localStorage.getItem("seoulmate_user_emoji") ?? "🐻");
    const today = new Date();
    const match = TRIP_DAYS.find((d) => isSameDay(d, today));
    if (match) setSelectedDay(match);
  }, []);

  const daysLeft      = differenceInDays(TRIP_START, new Date());
  const dayActivities = activities.filter((a) => isSameDay(parseISO(a.activity_date), selectedDay));
  const greeting      = getGreeting();

  return (
    <div className="flex flex-col min-h-dvh bg-cream">

      {/* ── Header ── */}
      <div className="px-5 pt-safe pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-ink-faint font-medium">
              {format(new Date(), "M月d日 EEEE", { locale: zhCN })}
            </p>
            <h1 className="text-2xl font-black text-ink tracking-tight mt-0.5">
              {greeting}，{userName} 👋
            </h1>
            <DualClock />
          </div>
          <div className="ml-3 mt-0.5 h-12 w-12 rounded-3xl bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-2xl shrink-0"
               style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}>
            {userEmoji}
          </div>
        </div>
      </div>

      {/* ── Map preview at the top ── */}
      <MapPreviewCard />

      {/* ── Malaysia return countdown ── */}
      <MalaysiaCountdown />

      {/* ── Departure countdown (before trip) ── */}
      {daysLeft > 0 && (
        <div className="mx-4 mb-4 rounded-3xl overflow-hidden relative"
             style={{ background: "linear-gradient(135deg, #E8A800 0%, #F4C842 100%)", boxShadow: "0 8px 32px rgba(232,168,0,0.25)" }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
          <div className="px-5 py-4 relative z-10">
            <p className="text-ginger-700 text-xs font-semibold uppercase tracking-airy">距离出发</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-5xl font-black text-white">{daysLeft}</span>
              <span className="text-white/80 text-lg font-bold">天</span>
            </div>
            <p className="text-white/70 text-xs mt-1">
              {format(TRIP_START, "M月d日")} 出发 · 共 {differenceInDays(TRIP_END, TRIP_START) + 1} 天
            </p>
          </div>
        </div>
      )}

      {/* During trip banner */}
      {daysLeft <= 0 && new Date() <= TRIP_END && (
        <div className="mx-4 mb-4 rounded-3xl px-5 py-3 flex items-center gap-3"
             style={{ background: "linear-gradient(135deg, #5B8862, #4A9592)", boxShadow: "0 8px 24px rgba(91,136,98,0.25)" }}>
          <span className="text-3xl animate-plane-bob inline-block">✈️</span>
          <div>
            <p className="text-white font-bold text-sm">旅程进行中！</p>
            <p className="text-white/70 text-xs">享受首尔每一刻 🌟</p>
          </div>
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="flex gap-2 px-4 mb-4">
        <Link href="/ai-tools"
          className="flex-1 flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-ink-mid"
          style={{ boxShadow: "var(--shadow-card)" }}>
          <Camera className="h-4 w-4 text-lavender" /> AI 翻译
        </Link>
        <Link href="/wishlist"
          className="flex-1 flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-ink-mid"
          style={{ boxShadow: "var(--shadow-card)" }}>
          <Heart className="h-4 w-4 text-petal-400" /> 心愿打卡
        </Link>
      </div>

      {/* ── Day tabs ── */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TRIP_DAYS.map((day, i) => {
            const isActive = isSameDay(day, selectedDay);
            const hasTasks = activities.some((a) => isSameDay(parseISO(a.activity_date), day));
            return (
              <button key={i} onClick={() => { tap(); setSelectedDay(day); }}
                className="flex flex-col items-center shrink-0 rounded-2xl px-3 py-2.5 transition-all duration-200"
                style={{
                  background: isActive ? "#5B8862" : "#FFFFFF",
                  boxShadow: isActive ? "0 4px 16px rgba(91,136,98,0.30)" : "var(--shadow-card)",
                  minWidth: 52,
                }}>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-white/70" : "text-ink-faint"}`}>
                  DAY{i + 1}
                </span>
                <span className={`text-lg font-black ${isActive ? "text-white" : "text-ink"}`}>
                  {format(day, "d")}
                </span>
                <span className={`text-[9px] ${isActive ? "text-white/60" : "text-ink-faint"}`}>
                  {format(day, "EEE", { locale: zhCN })}
                </span>
                {hasTasks && !isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-sage-300 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Day activities ── */}
      <div className="px-4 pb-safe flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">
            {isToday(selectedDay) ? "今日行程" : `${format(selectedDay, "M月d日")} 行程`}
          </h2>
          <button onClick={() => { tap(); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-sage text-white text-xs font-bold rounded-2xl px-3 py-2"
            style={{ boxShadow: "0 4px 12px rgba(91,136,98,0.30)" }}>
            <Plus className="h-3.5 w-3.5" /> 新增
          </button>
        </div>

        {isLoading ? (
          <LoadingPlane text="载入行程中…" />
        ) : dayActivities.length === 0 ? (
          <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-4xl mb-3">🗺️</div>
            <p className="font-bold text-ink text-sm">这天还没有行程</p>
            <p className="text-xs text-ink-muted mt-1">点击右上角新增活动吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayActivities.map((act, idx) => (
              <div key={act.id} className="relative flex gap-3 rounded-3xl bg-surface p-4"
                   style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex flex-col items-center shrink-0">
                  <div className={`h-9 w-9 rounded-2xl flex items-center justify-center text-lg ${CAT_COLOR[act.category] ?? "bg-black/5 text-ink-muted"}`}>
                    {CAT_EMOJI[act.category] ?? "📌"}
                  </div>
                  {idx < dayActivities.length - 1 && (
                    <div className="w-0.5 flex-1 mt-2 mb-[-12px]"
                         style={{ background: "linear-gradient(to bottom, #C0D6C1, transparent)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="font-bold text-ink text-sm">{act.title}</p>
                  {act.start_time && (
                    <p className="text-xs text-ink-muted mt-0.5">
                      {format(parseISO(`2000-01-01T${act.start_time}`), "HH:mm")}
                      {act.end_time && ` – ${format(parseISO(`2000-01-01T${act.end_time}`), "HH:mm")}`}
                    </p>
                  )}
                  {act.place_name && (
                    <p className="text-xs text-ink-faint mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{act.place_name}
                    </p>
                  )}
                </div>
                <button onClick={() => deleteActivity.mutate(act.id)}
                  className="absolute top-3 right-3 text-ink-faint hover:text-petal-400 p-1 rounded-xl transition-colors">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="新增行程" size="full">
        <ActivityForm
          onSubmit={async (form) => {
            await addActivity.mutateAsync({ ...form, activity_date: format(selectedDay, "yyyy-MM-dd") });
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <style>{`
        @keyframes plane-bob { 0%,100%{transform:translateY(0) rotate(-4deg);} 50%{transform:translateY(-10px) rotate(2deg);} }
        .animate-plane-bob { animation: plane-bob 2.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
