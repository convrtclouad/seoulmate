"use client";

import { ExternalLink, Navigation, MapPin, Clock, Train, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { tap } from "@/lib/utils/haptics";

const AIRBNB_ADDRESS_KO = "서울특별시 마포구 연세로2나길";
const AIRBNB_ADDRESS_EN = "Yonsei-ro 2na-gil, Mapo-gu, Seoul";

const NAVER_MAP_URL  = `https://map.naver.com/v5/search/${encodeURIComponent("연세로2나길 마포구 서울")}`;
const NAVER_APP_LINK = `nmap://search?query=${encodeURIComponent("연세로2나길 마포구")}`;

const NEARBY: { name: string; nameEn: string; walk: string; emoji: string; hex: string }[] = [
  { name: "상수역 (6호선)",    nameEn: "Sangsu Station",      walk: "도보 3분",  emoji: "🚇", hex: "#5B8862" },
  { name: "홍대입구 (2호선)", nameEn: "Hongik Univ. Stn",    walk: "도보 12분", emoji: "🚇", hex: "#8B7AB8" },
  { name: "신촌역 (2호선)",   nameEn: "Sinchon Station",     walk: "도보 18분", emoji: "🚇", hex: "#4A9592" },
  { name: "홍대 클럽거리",    nameEn: "Hongdae Club Street", walk: "도보 8분",  emoji: "🎵", hex: "#E87060" },
  { name: "망원한강공원",     nameEn: "Mangwon Han River",   walk: "도보 20분", emoji: "🌊", hex: "#6BA3BE" },
  { name: "연남동 카페거리",  nameEn: "Yeonnam-dong Cafes",  walk: "도보 15분", emoji: "☕", hex: "#E8A800" },
];

const ATTRACTIONS: { name: string; area: string; how: string; emoji: string }[] = [
  { name: "경복궁",   area: "광화문",  how: "6호선→5호선 15分", emoji: "🏯" },
  { name: "남산타워", area: "남산",    how: "버스·택시 20分",   emoji: "🗼" },
  { name: "명동",     area: "중구",    how: "6호선→4호선 20分", emoji: "🛍️" },
  { name: "이태원",   area: "용산",    how: "6호선 직통 10分",  emoji: "🌍" },
  { name: "성수동",   area: "성동구",  how: "2호선 환승 25分",  emoji: "🏭" },
  { name: "광장시장", area: "종로",    how: "6호선→1호선 20分", emoji: "🥘" },
];

function openNaverMap() {
  if (/android|iphone|ipad/i.test(navigator.userAgent)) {
    window.location.href = NAVER_APP_LINK;
    setTimeout(() => { window.open(NAVER_MAP_URL, "_blank", "noopener"); }, 800);
  } else {
    window.open(NAVER_MAP_URL, "_blank", "noopener");
  }
}

export default function MapPage() {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    tap();
    await navigator.clipboard.writeText(AIRBNB_ADDRESS_EN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-cream">

      {/* ── Hero neighbourhood map ── */}
      <div className="relative mx-4 mt-safe mt-4 rounded-3xl overflow-hidden mb-4"
           style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}>
        <div style={{ background: "linear-gradient(175deg, #89C4E8 0%, #B8DDF0 35%, #D8EED8 65%, #E8F4E8 100%)", minHeight: 220, position: "relative" }}>

          {/* Sun */}
          <div style={{ position:"absolute", top:20, right:24, width:44, height:44,
            background:"linear-gradient(135deg,#FFF176,#FFD600)", borderRadius:"50%",
            boxShadow:"0 0 30px rgba(255,214,0,0.5)" }} />

          {/* Building silhouettes */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", alignItems:"flex-end", padding:"0 8px" }}>
            {[{w:22,h:55},{w:16,h:38},{w:28,h:78},{w:14,h:32},{w:30,h:92},
              {w:18,h:48},{w:24,h:68},{w:12,h:28},{w:28,h:82},{w:16,h:42},
              {w:26,h:62},{w:14,h:35},{w:20,h:52},{w:18,h:44}].map((b,i) => (
              <div key={i} style={{ width:b.w, height:b.h, marginRight:i%3===0?6:2,
                background:["#2C4731","#3A5D40","#4E7A55","#2C4731"][i%4],
                borderRadius:"3px 3px 0 0", opacity:0.3+(i%3)*0.12 }} />
            ))}
          </div>

          {/* Han River */}
          <div style={{ position:"absolute", bottom:16, left:0, right:0, height:10,
            background:"rgba(100,180,220,0.28)", backdropFilter:"blur(2px)" }} />

          {/* Home pin */}
          <div style={{ position:"absolute", left:"50%", top:"46%", transform:"translate(-50%,-50%)" }}
               className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full flex items-center justify-center text-2xl"
                 style={{ background:"#5B8862", boxShadow:"0 6px 28px rgba(91,136,98,0.55)" }}>🏠</div>
            <div className="mt-2 rounded-2xl bg-white px-3 py-1.5"
                 style={{ boxShadow:"0 4px 16px rgba(0,0,0,0.18)" }}>
              <p className="text-[11px] font-black text-ink">우리 숙소 · 我们的住所</p>
            </div>
          </div>

          {/* Sangsu station dot */}
          <div style={{ position:"absolute", left:"22%", top:"40%" }} className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-sm"
                 style={{ boxShadow:"0 3px 12px rgba(0,0,0,0.2)", border:"2.5px solid #5B8862" }}>🚇</div>
            <p className="text-[9px] font-bold text-white mt-0.5" style={{ textShadow:"0 1px 3px rgba(0,0,0,0.6)" }}>상수역</p>
          </div>
          {/* Hongdae dot */}
          <div style={{ position:"absolute", left:"6%", top:"25%" }} className="flex flex-col items-center">
            <div className="h-7 w-7 rounded-full bg-white/85 flex items-center justify-center text-xs"
                 style={{ boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>🎵</div>
            <p className="text-[8px] font-semibold text-white mt-0.5" style={{ textShadow:"0 1px 3px rgba(0,0,0,0.5)" }}>홍대</p>
          </div>
          {/* Sinchon dot */}
          <div style={{ position:"absolute", right:"14%", top:"28%" }} className="flex flex-col items-center">
            <div className="h-7 w-7 rounded-full bg-white/85 flex items-center justify-center text-xs"
                 style={{ boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>☕</div>
            <p className="text-[8px] font-semibold text-white mt-0.5" style={{ textShadow:"0 1px 3px rgba(0,0,0,0.5)" }}>신촌</p>
          </div>

          {/* Compass */}
          <div className="absolute top-3 left-3 h-7 w-7 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center text-xs font-black text-ink">N</div>

          {/* Naver nav button */}
          <button onClick={() => { tap(); openNaverMap(); }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-white text-[11px] font-bold active:scale-95"
            style={{ background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)" }}>
            <Navigation className="h-3 w-3" /> 导航
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4 pb-32">

        {/* ── Airbnb info card ── */}
        <div className="rounded-3xl bg-surface overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          {/* Photo placeholder */}
          <div className="relative h-44 flex flex-col items-center justify-center gap-2"
               style={{ background:"linear-gradient(135deg,#F5F3FA 0%,#EAE6F4 50%,#E0EBE0 100%)" }}>
            <span className="text-5xl">🏠</span>
            <p className="text-xs font-semibold text-lavender/60">상수동 게스트하우스</p>
            <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-2xl px-2.5 py-1">
              <p className="text-[10px] font-bold text-lavender">★ 4.92 · Superhost</p>
            </div>
            <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm rounded-2xl px-2.5 py-1">
              <p className="text-[10px] font-bold text-sage">5月7日 – 5月15日 · 8晚</p>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <p className="font-black text-ink text-sm">상수동 아파트</p>
                <p className="text-xs text-ink-muted">마포구 Mapo-gu · Seoul</p>
                <div className="flex items-start gap-1.5 mt-2">
                  <MapPin className="h-3.5 w-3.5 text-sage shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-ink">{AIRBNB_ADDRESS_KO}</p>
                    <p className="text-[10px] text-ink-muted">{AIRBNB_ADDRESS_EN}</p>
                  </div>
                </div>
              </div>
              <button onClick={copyAddress}
                className={`shrink-0 h-9 w-9 rounded-2xl flex items-center justify-center transition-all ${
                  copied ? "bg-sage-100 text-sage-600" : "bg-black/5 text-ink-muted"
                }`}>
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => { tap(); openNaverMap(); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white"
                style={{ background:"#03C75A" }}>
                <ExternalLink className="h-3.5 w-3.5" /> Naver 地图
              </button>
              <a href={`https://maps.apple.com/?q=${encodeURIComponent(AIRBNB_ADDRESS_EN)}`}
                 target="_blank" rel="noopener noreferrer" onClick={() => tap()}
                 className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold bg-black/5 text-ink-mid">
                <MapPin className="h-3.5 w-3.5" /> Apple 地图
              </a>
            </div>
          </div>
        </div>

        {/* ── Nearby ── */}
        <div>
          <h2 className="section-title mb-3">📍 附近地铁 & 景点</h2>
          <div className="space-y-2">
            {NEARBY.map((place) => (
              <div key={place.name} className="rounded-2xl bg-surface px-4 py-3 flex items-center gap-3"
                   style={{ boxShadow:"var(--shadow-card)" }}>
                <div className="h-9 w-9 rounded-2xl flex items-center justify-center text-lg shrink-0"
                     style={{ background: place.hex + "22" }}>
                  {place.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">{place.name}</p>
                  <p className="text-[10px] text-ink-faint">{place.nameEn}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3 text-ink-faint" />
                  <span className="text-xs font-semibold text-ink-muted">{place.walk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Attraction transit guide ── */}
        <div>
          <h2 className="section-title mb-3">🗺️ 首尔景点交通参考</h2>
          <div className="grid grid-cols-2 gap-2">
            {ATTRACTIONS.map((a) => (
              <div key={a.name} className="rounded-2xl bg-surface p-3" style={{ boxShadow:"var(--shadow-card)" }}>
                <span className="text-xl">{a.emoji}</span>
                <p className="font-bold text-ink text-sm mt-1.5">{a.name}</p>
                <p className="text-[10px] text-ink-faint">{a.area}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Train className="h-3 w-3 text-sage shrink-0" />
                  <p className="text-[10px] text-ink-muted leading-tight">{a.how}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Emergency ── */}
        <div className="rounded-3xl p-4 space-y-2"
             style={{ background:"linear-gradient(135deg,#FEF5F3,#FDE8E3)", boxShadow:"var(--shadow-card)" }}>
          <p className="text-xs font-bold text-petal-400">🆘 韩国紧急联系</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[{label:"警察",num:"112"},{label:"救护车",num:"119"},{label:"旅游热线",num:"1330"}].map((e) => (
              <a key={e.num} href={`tel:${e.num}`} onClick={() => tap()}
                 className="rounded-2xl bg-white/60 py-2 active:scale-95 transition-transform">
                <p className="text-base font-black text-ink">{e.num}</p>
                <p className="text-[10px] text-ink-muted">{e.label}</p>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
