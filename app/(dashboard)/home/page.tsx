"use client";

import { useEffect, useState } from "react";
import { Plus, MapPin, Cloud } from "lucide-react";
import { useSchedule, useAddActivity, useDeleteActivity } from "@/lib/hooks/useSchedule";
import { useMembers } from "@/lib/hooks/useMembers";
import { LoadingPlane } from "@/components/ui/LoadingPlane";
import { Modal } from "@/components/ui/Modal";
import { ActivityForm } from "@/components/schedule/ActivityForm";
import { format, parseISO, differenceInDays, addDays, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";

const TRIP_ID   = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const TRIP_START = new Date("2026-05-08");
const TRIP_END   = new Date("2026-05-16");

const TRIP_DAYS = Array.from({ length: differenceInDays(TRIP_END, TRIP_START) + 1 }, (_, i) =>
  addDays(TRIP_START, i)
);

const CAT_EMOJI: Record<string, string> = {
  transport: "🚇", food: "🍜", attraction: "🏯",
  accommodation: "🏨", shopping: "🛍️", other: "📌",
};
const CAT_COLOR: Record<string, string> = {
  transport: "bg-ginger-100 text-ginger-500",
  food: "bg-petal-100 text-petal-400",
  attraction: "bg-sage-100 text-sage-600",
  accommodation: "bg-lavender-100 text-lavender-400",
  shopping: "bg-mist-100 text-mist-400",
  other: "bg-black/5 text-ink-muted",
};

export default function HomePage() {
  const { data: activities = [], isLoading } = useSchedule(TRIP_ID);
  const { data: members = [] } = useMembers();
  const addActivity    = useAddActivity(TRIP_ID);
  const deleteActivity = useDeleteActivity(TRIP_ID);

  const [userName, setUserName]   = useState("旅行者");
  const [userEmoji, setUserEmoji] = useState("✈️");
  const [selectedDay, setSelectedDay] = useState(TRIP_DAYS[0]);
  const [showForm, setShowForm]   = useState(false);

  useEffect(() => {
    setUserName(localStorage.getItem("seoulmate_user_name") ?? "旅行者");
    setUserEmoji(localStorage.getItem("seoulmate_user_emoji") ?? "✈️");
    // Auto-select today if within trip
    const today = new Date();
    const match = TRIP_DAYS.find((d) => isSameDay(d, today));
    if (match) setSelectedDay(match);
  }, []);

  const daysLeft = differenceInDays(TRIP_START, new Date());
  const dayActivities = activities.filter((a) => isSameDay(parseISO(a.activity_date), selectedDay));

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* ── Top bar ── */}
      <div className="px-5 pt-safe pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-muted font-medium">
              {format(new Date(), "M月d日 EEEE", { locale: zhCN })}
            </p>
            <h1 className="text-xl font-black text-ink mt-0.5 tracking-tight">
              首尔行程 🇰🇷
            </h1>
          </div>
          {/* Member avatars */}
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <div key={m.id}
                className={`h-8 w-8 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-sm ring-2 ring-cream`}
                title={m.name}
              >
                {m.emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Countdown card ── */}
      {daysLeft > 0 ? (
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
      ) : (
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
        <Link href="/map"
          className="flex-1 flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-ink-mid"
          style={{ boxShadow: "var(--shadow-card)" }}>
          <MapPin className="h-4 w-4 text-mist-400" /> 景点地图
        </Link>
        <Link href="/ai-tools"
          className="flex-1 flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-ink-mid"
          style={{ boxShadow: "var(--shadow-card)" }}>
          <Cloud className="h-4 w-4 text-lavender" /> AI翻译
        </Link>
      </div>

      {/* ── Day tabs ── */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TRIP_DAYS.map((day, i) => {
            const isActive = isSameDay(day, selectedDay);
            const hasTasks = activities.some((a) => isSameDay(parseISO(a.activity_date), day));
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day)}
                className="flex flex-col items-center shrink-0 rounded-2xl px-3 py-2.5 transition-all duration-200"
                style={{
                  background: isActive ? "#5B8862" : "#FFFFFF",
                  boxShadow: isActive ? "0 4px 16px rgba(91,136,98,0.30)" : "var(--shadow-card)",
                  minWidth: 52,
                }}
              >
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
            {format(selectedDay, "M月d日")} 行程
          </h2>
          <button onClick={() => setShowForm(true)}
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
              <div key={act.id}
                className="relative flex gap-3 rounded-3xl bg-surface p-4"
                style={{ boxShadow: "var(--shadow-card)" }}>
                {/* Timeline dot */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`h-9 w-9 rounded-2xl flex items-center justify-center text-lg ${CAT_COLOR[act.category] ?? "bg-black/5 text-ink-muted"}`}>
                    {CAT_EMOJI[act.category] ?? "📌"}
                  </div>
                  {idx < dayActivities.length - 1 && (
                    <div className="w-0.5 flex-1 mt-2 mb-[-12px]" style={{ background: "linear-gradient(to bottom, #C0D6C1, transparent)" }} />
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

      {/* Add activity modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="新增行程" size="full">
        <ActivityForm
          onSubmit={async (form) => { await addActivity.mutateAsync({ ...form, activity_date: format(selectedDay, "yyyy-MM-dd") }); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <style>{`
        @keyframes plane-bob { 0%,100% { transform:translateY(0) rotate(-4deg); } 50% { transform:translateY(-10px) rotate(2deg); } }
        .animate-plane-bob { animation: plane-bob 2.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
