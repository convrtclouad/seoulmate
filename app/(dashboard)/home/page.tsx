"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Camera, Heart, ChevronRight, Navigation, Cloud, CloudOff } from "lucide-react";
import { TimelineItem } from "@/components/schedule/TimelineItem";
import { hasSupabase } from "@/lib/supabase/client";
import { tap } from "@/lib/utils/haptics";
import { useSchedule, useAddActivity, useDeleteActivity } from "@/lib/hooks/useSupabaseSchedule";
import { LoadingPlane } from "@/components/ui/LoadingPlane";
import { Modal } from "@/components/ui/Modal";
import { ActivityForm } from "@/components/schedule/ActivityForm";
import { format, parseISO, differenceInDays, addDays, isSameDay, isToday } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";

const TRIP_ID    = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const TRIP_START = new Date("2026-05-08"); // Day 1 = first day in Korea (arrived 07:00)
const TRIP_END   = new Date("2026-05-15");

const TRIP_DAYS = Array.from(
  { length: differenceInDays(TRIP_END, TRIP_START) + 1 },
  (_, i) => addDays(TRIP_START, i)
);


function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return "夜深了";
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function wmoToEmoji(code: number): string {
  if (code === 0)  return "☀️";
  if (code <= 2)   return "🌤️";
  if (code === 3)  return "☁️";
  if (code <= 48)  return "🌫️";
  if (code <= 55)  return "🌦️";
  if (code <= 65)  return "🌧️";
  if (code <= 75)  return "❄️";
  if (code <= 82)  return "🌦️";
  return "⛈️";
}
function wmoToLabel(code: number): string {
  if (code === 0)  return "晴朗";
  if (code <= 2)   return "少云";
  if (code === 3)  return "多云";
  if (code <= 48)  return "有雾";
  if (code <= 55)  return "小雨";
  if (code <= 65)  return "雨天";
  if (code <= 75)  return "下雪";
  if (code <= 82)  return "阵雨";
  return "雷雨";
}
function wmoAnim(code: number): string {
  if (code === 0)        return "anim-sun";
  if (code >= 51)        return "anim-rain";
  return "anim-float";
}

interface WeatherData { temp: number; code: number; }

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia%2FSeoul`;
  const res  = await fetch(url);
  const json = await res.json();
  return { temp: Math.round(json.current.temperature_2m), code: json.current.weather_code };
}

/* ── Weather Widget ── */
function WeatherWidget() {
  const [seoul,  setSeoul]  = useState<WeatherData | null>(null);
  const [busan,  setBusan]  = useState<WeatherData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchWeather(37.5665, 126.9780),
      fetchWeather(35.1796, 129.0756),
    ]).then(([s, b]) => {
      setSeoul(s); setBusan(b); setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
        {["首尔", "釜山"].map(c => (
          <div key={c} className="rounded-3xl h-20 animate-pulse"
               style={{ background: "linear-gradient(135deg,#3A7BD5,#5B9BE5)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
      {[
        { city: "首尔", en: "Seoul", data: seoul },
        { city: "釜山", en: "Busan", data: busan },
      ].map(({ city, en, data }) => (
        <div key={en} className="rounded-3xl overflow-hidden"
             style={{ background: "linear-gradient(135deg, #3A7BD5 0%, #5B9BE5 100%)", boxShadow: "0 6px 20px rgba(58,123,213,0.25)" }}>
          <div className="px-4 py-3">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{city} · {en}</p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-white font-black text-3xl leading-none">
                {data ? `${data.temp}°` : "—"}
              </p>
              <span className={`text-2xl ${data ? wmoAnim(data.code) : ""}`}>
                {data ? wmoToEmoji(data.code) : "🌡️"}
              </span>
            </div>
            <p className="text-white/60 text-[10px] mt-1.5 font-semibold">
              {data ? wmoToLabel(data.code) : "获取中…"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Dual timezone clock — Seoul primary, KL secondary ── */
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
    <div className="mt-2 flex items-center gap-2">
      {/* Seoul — primary */}
      <div className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5"
           style={{ background: "rgba(91,136,98,0.12)" }}>
        <span className="text-sm">🇰🇷</span>
        <span className="text-sm font-black text-ink">首尔 {krTime}</span>
      </div>
      {/* KL — secondary */}
      <div className="inline-flex items-center gap-1.5 rounded-2xl bg-surface px-2.5 py-1.5"
           style={{ boxShadow: "var(--shadow-card)" }}>
        <span className="text-xs">🇲🇾</span>
        <span className="text-xs font-semibold text-ink-mid">KL {klTime}</span>
      </div>
    </div>
  );
}

/* ── Real-time GPS location card ── */
function LocationCard() {
  const [place,  setPlace]  = useState<{ district: string; city: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "denied">("idle");
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) { setStatus("denied"); return; }
    setStatus("loading");
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=zh`,
            { headers: { "User-Agent": "SeoulMateApp/1.0" } }
          );
          const json = await res.json();
          const addr = json.address ?? {};
          setPlace({
            district: addr.neighbourhood ?? addr.suburb ?? addr.village ?? addr.town ?? addr.county ?? "当前位置",
            city:     addr.city ?? addr.state ?? addr.country ?? "",
          });
          setStatus("ok");
        } catch { setStatus("ok"); }
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  return (
    <div className="mx-4 mb-4 rounded-3xl overflow-hidden"
         style={{ background: "linear-gradient(160deg, #B8D4F0 0%, #D4E8F8 40%, #E8F4E8 100%)", boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
      <div className="relative p-4 min-h-[110px]">
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10">
          {[25, 50, 75].map(p => (
            <div key={p} className="absolute inset-x-0 border-t border-blue-400" style={{ top: `${p}%` }} />
          ))}
          {[33, 66].map(p => (
            <div key={p} className="absolute inset-y-0 border-l border-blue-400" style={{ left: `${p}%` }} />
          ))}
        </div>

        {/* Location pin */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="h-11 w-11 rounded-full bg-sage flex items-center justify-center shadow-lg"
               style={{ boxShadow: "0 4px 20px rgba(91,136,98,0.5)" }}>
            {status === "loading"
              ? <span className="text-white font-bold anim-spin-slow">◌</span>
              : <Navigation className="h-5 w-5 text-white" />}
          </div>
          {status === "ok" && (
            <div className="absolute h-11 w-11 rounded-full border-2 border-sage/40 anim-ripple" />
          )}
        </div>

        {/* Nearby dots */}
        <div className="absolute top-5 left-10 h-3 w-3 rounded-full bg-petal-400/70 shadow-sm" />
        <div className="absolute top-8 right-12 h-3 w-3 rounded-full bg-ginger-400/70 shadow-sm" />
        <div className="absolute bottom-10 left-16 h-2.5 w-2.5 rounded-full bg-lavender/70 shadow-sm" />

        {/* District label */}
        {status === "ok" && place && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-2xl px-2.5 py-1"
               style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            <p className="text-[10px] font-black text-ink">{place.district}</p>
          </div>
        )}

        {/* Status dot */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-2xl px-2 py-1"
             style={{ boxShadow: "var(--shadow-card)" }}>
          <div className={`h-1.5 w-1.5 rounded-full ${status === "ok" ? "bg-sage anim-blink" : status === "loading" ? "bg-ginger-400" : "bg-ink-faint"}`} />
          <span className="text-[9px] font-bold text-ink-mid">
            {status === "ok" ? "实时定位" : status === "loading" ? "定位中" : "无法定位"}
          </span>
        </div>
      </div>

      <div className="bg-surface px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-ink">我们现在在这里 📍</p>
          <p className="text-[10px] text-ink-muted mt-0.5">
            {status === "ok" && place
              ? `${place.district}${place.city ? ` · ${place.city}` : ""}`
              : status === "loading" ? "正在获取位置…"
              : status === "denied"  ? "请允许位置权限"
              : "获取中…"}
          </p>
        </div>
        <Link href="/map" className="flex items-center gap-1 text-sage text-xs font-bold">
          查看地图 <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ── Malaysia return countdown ── */
function MalaysiaCountdown() {
  const now      = new Date();
  const daysBack = differenceInDays(TRIP_END, now);
  const returned = now > TRIP_END;
  if (returned) return null;

  return (
    <div className="mx-4 mb-4 rounded-3xl overflow-hidden"
         style={{ background: "linear-gradient(135deg, #1A2A5E 0%, #2C3E6B 60%, #3D5A9A 100%)", boxShadow: "0 8px 28px rgba(44,62,107,0.30)" }}>
      <div className="px-5 py-4 flex items-center gap-4">
        <span className="text-3xl shrink-0">🇲🇾</span>
        <div className="flex-1 min-w-0">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">距离返程</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white leading-none">
              {daysBack > 0 ? daysBack : "0"}
            </span>
            <span className="text-white/70 text-xl font-bold">天</span>
          </div>
          <p className="text-white/40 text-[10px] mt-1.5">
            {format(TRIP_END, "M月d日")} 返回吉隆坡 ✈️
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center">
          <p className="text-white/30 text-[9px] font-bold mb-1">MAY</p>
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
            <span className="text-white font-black text-2xl">15</span>
          </div>
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
            <div className="flex items-center gap-2">
              <p className="text-xs text-ink-faint font-medium">
                {format(new Date(), "M月d日 EEEE", { locale: zhCN })}
              </p>
              {/* Supabase connection indicator */}
              {hasSupabase() ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2 py-0.5">
                  <Cloud className="h-2.5 w-2.5 text-sage" />
                  <span className="text-[9px] font-bold text-sage">已同步</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-petal-100 px-2 py-0.5">
                  <CloudOff className="h-2.5 w-2.5 text-petal-400" />
                  <span className="text-[9px] font-bold text-petal-400">未连接</span>
                </span>
              )}
            </div>
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

      {/* ── Weather ── */}
      <WeatherWidget />

      {/* ── Real-time location ── */}
      <LocationCard />

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

      {/* ── Quick actions ── */}
      <div className="flex gap-2 px-4 mb-4">
        <Link href="/ai-tools"
          className="flex-1 flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-ink-mid"
          style={{ boxShadow: "var(--shadow-card)" }}>
          <Camera className="h-4 w-4 text-lavender" /> AI 翻译
        </Link>
        <Link href="/prepare"
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
          <div>
            {dayActivities.map((act, idx) => (
              <TimelineItem
                key={act.id}
                activity={act}
                isLast={idx === dayActivities.length - 1}
                onDelete={(id) => deleteActivity.mutate(id)}
              />
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
        .anim-sun  { animation: sunSpin  8s linear        infinite; display:inline-block; }
        .anim-float{ animation: floatBob 3s ease-in-out   infinite; display:inline-block; }
        .anim-rain { animation: rainDrop 1.4s ease-in-out infinite; display:inline-block; }
        .anim-ripple     { animation: rippleOut 2s ease-out infinite; }
        .anim-spin-slow  { animation: spinSlow  1s linear  infinite; display:inline-block; }
        .anim-blink      { animation: blinkDot  2s ease-in-out infinite; }
        @keyframes sunSpin  { from{transform:rotate(0)}   to{transform:rotate(360deg)} }
        @keyframes floatBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes rainDrop { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
        @keyframes rippleOut{ 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.5);opacity:0} }
        @keyframes spinSlow { from{transform:rotate(0)}   to{transform:rotate(360deg)} }
        @keyframes blinkDot { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  );
}
