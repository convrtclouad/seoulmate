"use client";

import { useState } from "react";
import { MapPin, Navigation, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { openNaverMap } from "@/lib/utils/maps";
import type { Profile } from "@/types";

const LANDMARKS = [
  { name: "景福宫",    lat: 37.5796, lng: 126.9770, emoji: "🏯" },
  { name: "南山塔",   lat: 37.5512, lng: 126.9882, emoji: "📡" },
  { name: "弘大",     lat: 37.5563, lng: 126.9231, emoji: "🎨" },
  { name: "江南",     lat: 37.4979, lng: 127.0276, emoji: "🏙️" },
  { name: "明洞",     lat: 37.5636, lng: 126.9847, emoji: "🛍️" },
  { name: "仁寺洞",   lat: 37.5745, lng: 126.9856, emoji: "🎋" },
  { name: "东大门",   lat: 37.5665, lng: 127.0091, emoji: "🌃" },
  { name: "北村",     lat: 37.5826, lng: 126.9830, emoji: "🏘️" },
];

interface CheckinLocal {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  place_name: string | null;
  created_at: string;
}

const LS_KEY = "seoulmate_checkins";

function loadCheckins(): CheckinLocal[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); }
  catch { return []; }
}

function saveCheckins(items: CheckinLocal[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, 50)));
}

interface SocialMapProps {
  tripId: string;
  currentUserId: string;
  profiles: Profile[];
}

const MAP_W = 100, MAP_H = 100;
const LAT_MIN = 37.47, LAT_MAX = 37.67;
const LNG_MIN = 126.86, LNG_MAX = 127.07;

function toX(lng: number) { return ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W; }
function toY(lat: number) { return ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H; }

export function SocialMap({ currentUserId, profiles }: SocialMapProps) {
  const [checkins, setCheckins] = useState<CheckinLocal[]>(loadCheckins);
  const [checking, setChecking] = useState(false);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  function reload() { setCheckins(loadCheckins()); }

  function checkIn() {
    if (!navigator.geolocation) { alert("浏览器不支持定位"); return; }
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const item: CheckinLocal = {
          id: Math.random().toString(36).slice(2),
          user_id: currentUserId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          place_name: null,
          created_at: new Date().toISOString(),
        };
        const updated = [item, ...loadCheckins().filter((c) => c.user_id !== currentUserId)];
        saveCheckins(updated);
        setCheckins(updated);
        setChecking(false);
      },
      () => { alert("无法获取你的位置"); setChecking(false); }
    );
  }

  // Latest per user
  const latestPerUser = new Map<string, CheckinLocal>();
  for (const c of checkins) {
    if (!latestPerUser.has(c.user_id)) latestPerUser.set(c.user_id, c);
  }

  return (
    <div className="space-y-4">
      {/* SVG Map */}
      <div className="rounded-2xl overflow-hidden border border-neutral-100 relative">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="w-full h-64"
          style={{ background: "linear-gradient(135deg, #d8f3dc 0%, #e0f2fe 100%)" }}
        >
          {/* Grid */}
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="100" stroke="#b7e4c7" strokeWidth="0.3" strokeDasharray="1,2" />
              <line x1="0" y1={v} x2="100" y2={v} stroke="#b7e4c7" strokeWidth="0.3" strokeDasharray="1,2" />
            </g>
          ))}

          {/* Landmark pins */}
          {LANDMARKS.map((l) => (
            <text key={l.name} x={toX(l.lng)} y={toY(l.lat)} fontSize="4" textAnchor="middle" dominantBaseline="middle">
              <title>{l.name}</title>
              {l.emoji}
            </text>
          ))}

          {/* Friend pins */}
          {Array.from(latestPerUser.values()).map((c) => {
            const x = toX(c.lng);
            const y = toY(c.lat);
            const isMe = c.user_id === currentUserId;
            const profile = profileMap.get(c.user_id);
            return (
              <g key={c.user_id}>
                <circle cx={x} cy={y} r="3" fill={isMe ? "#1B4332" : "#40916C"} stroke="white" strokeWidth="0.8" />
                <text x={x} y={y - 4.5} fontSize="2.5" textAnchor="middle" fill="#374151">
                  {profile?.display_name?.split(" ")[0] ?? "?"}
                </text>
              </g>
            );
          })}

          <text x="50" y="98" fontSize="2.5" textAnchor="middle" fill="#74C69D">首尔，韩国</text>
        </svg>

        <div className="absolute bottom-3 right-3">
          <Button size="sm" onClick={checkIn} loading={checking} icon={<Navigation className="h-4 w-4" />}>
            打卡位置
          </Button>
        </div>
      </div>

      {/* Landmarks quick-nav */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">首尔景点</p>
          <button onClick={reload} className="tap-target rounded-lg p-1.5 hover:bg-neutral-100">
            <RefreshCw className="h-3.5 w-3.5 text-neutral-400" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LANDMARKS.map((l) => (
            <button
              key={l.name}
              onClick={() => openNaverMap({ lat: l.lat, lng: l.lng, name: l.name })}
              className="flex items-center gap-2 rounded-xl bg-surface border border-neutral-100 px-3 py-2.5 text-left hover:border-forest-pale transition-colors"
            >
              <span className="text-xl">{l.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{l.name}</p>
                <p className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" /> 点击导航
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent checkins */}
      {checkins.length > 0 && (
        <div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">最近打卡</p>
          <div className="space-y-2">
            {checkins.slice(0, 5).map((c) => {
              const profile = profileMap.get(c.user_id);
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-surface px-3 py-2.5">
                  <div className="h-8 w-8 rounded-xl bg-forest-mist flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-forest-mid" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{profile?.display_name ?? "？"}</p>
                    <p className="text-xs text-neutral-400">
                      {c.place_name ?? `${c.lat.toFixed(3)}, ${c.lng.toFixed(3)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => openNaverMap({ lat: c.lat, lng: c.lng, name: profile?.display_name })}
                    className="rounded-lg p-1.5 bg-forest-mist hover:bg-forest-pale transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5 text-forest" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
