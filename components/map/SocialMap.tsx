"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, RefreshCw } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { openNaverMap } from "@/lib/utils/maps";
import type { Checkin, Profile } from "@/types";
import { formatDistanceToNow, parseISO } from "date-fns";

// Seoul area bounds for the static map
const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

// Landmark pins to make the map feel alive
const LANDMARKS = [
  { name: "Gyeongbokgung",    lat: 37.5796, lng: 126.9770, emoji: "🏯" },
  { name: "Namsan Tower",     lat: 37.5512, lng: 126.9882, emoji: "📡" },
  { name: "Hongdae",          lat: 37.5563, lng: 126.9231, emoji: "🎨" },
  { name: "Gangnam Station",  lat: 37.4979, lng: 127.0276, emoji: "🏙️" },
  { name: "Myeongdong",       lat: 37.5636, lng: 126.9847, emoji: "🛍️" },
  { name: "Insadong",         lat: 37.5745, lng: 126.9856, emoji: "🎋" },
];

interface SocialMapProps {
  tripId: string;
  currentUserId: string;
  profiles: Profile[];
}

export function SocialMap({ tripId, currentUserId, profiles }: SocialMapProps) {
  const [checkins, setCheckins]   = useState<Checkin[]>([]);
  const [checking, setChecking]   = useState(false);
  const [myLocation, setMyLoc]    = useState<GeolocationPosition | null>(null);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  useEffect(() => {
    loadCheckins();
    const supabase = getSupabaseClient();

    // Real-time updates for checkins
    const channel = supabase
      .channel(`checkins:${tripId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins", filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setCheckins((prev) => [payload.new as Checkin, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function loadCheckins() {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("checkins")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setCheckins(data as Checkin[]);
  }

  async function checkIn() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setMyLoc(pos);
        const supabase = getSupabaseClient();
        await supabase.from("checkins").insert({
          trip_id:    tripId,
          user_id:    currentUserId,
          lat:        pos.coords.latitude,
          lng:        pos.coords.longitude,
          place_name: null,
        });
        setChecking(false);
        loadCheckins();
      },
      () => {
        alert("Could not get your location.");
        setChecking(false);
      }
    );
  }

  // Latest checkin per user
  const latestPerUser = new Map<string, Checkin>();
  for (const c of checkins) {
    if (!latestPerUser.has(c.user_id)) latestPerUser.set(c.user_id, c);
  }

  // Convert lat/lng to SVG coordinates relative to Seoul area
  // Simple linear mapping over a ~0.2° × 0.2° bounding box
  const MAP_W = 100;
  const MAP_H = 100;
  const LAT_MIN = 37.47, LAT_MAX = 37.67;
  const LNG_MIN = 126.86, LNG_MAX = 127.07;

  function toSvgX(lng: number): number {
    return ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W;
  }
  function toSvgY(lat: number): number {
    // Invert Y (higher lat = lower Y)
    return ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H;
  }

  return (
    <div className="space-y-4">
      {/* SVG Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 bg-blue-50/50 relative">
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="w-full h-64"
          style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)" }}
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="100" stroke="#cbd5e1" strokeWidth="0.3" strokeDasharray="1,2" />
              <line x1="0" y1={v} x2="100" y2={v} stroke="#cbd5e1" strokeWidth="0.3" strokeDasharray="1,2" />
            </g>
          ))}

          {/* Landmark pins */}
          {LANDMARKS.map((l) => (
            <text
              key={l.name}
              x={toSvgX(l.lng)}
              y={toSvgY(l.lat)}
              fontSize="4"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              <title>{l.name}</title>
              {l.emoji}
            </text>
          ))}

          {/* Friend checkin pins */}
          {Array.from(latestPerUser.values()).map((checkin) => {
            const x = toSvgX(checkin.lng);
            const y = toSvgY(checkin.lat);
            const profile = profileMap.get(checkin.user_id);
            const isMe    = checkin.user_id === currentUserId;
            return (
              <g key={checkin.user_id}>
                <circle
                  cx={x} cy={y} r="3"
                  fill={isMe ? "#ec4899" : "#6366f1"}
                  stroke="white" strokeWidth="0.8"
                />
                <text x={x} y={y - 4.5} fontSize="2.5" textAnchor="middle" fill="#374151">
                  {profile?.display_name?.split(" ")[0] ?? "?"}
                </text>
              </g>
            );
          })}

          {/* Center label */}
          <text x="50" y="98" fontSize="2.5" textAnchor="middle" fill="#94a3b8">
            Seoul, South Korea
          </text>
        </svg>

        {/* Check-in button overlay */}
        <div className="absolute bottom-3 right-3">
          <Button
            size="sm"
            onClick={checkIn}
            loading={checking}
            icon={<Navigation className="h-4 w-4" />}
          >
            Check In
          </Button>
        </div>
      </div>

      {/* Friend list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Recent check-ins
          </p>
          <button
            onClick={loadCheckins}
            className="tap-target rounded-lg p-1.5 hover:bg-gray-100"
          >
            <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>

        {checkins.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No check-ins yet. Be the first! 📍
          </p>
        ) : (
          checkins.slice(0, 8).map((checkin) => {
            const profile = profileMap.get(checkin.user_id);
            return (
              <div key={checkin.id}
                   className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                <Avatar profile={profile} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {profile?.display_name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    <MapPin className="h-3 w-3 inline mr-0.5" />
                    {checkin.place_name ?? `${checkin.lat.toFixed(4)}, ${checkin.lng.toFixed(4)}`}
                    {" · "}
                    {formatDistanceToNow(parseISO(checkin.created_at), { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={() => openNaverMap({ lat: checkin.lat, lng: checkin.lng, name: profile?.display_name })}
                  className="rounded-lg p-1.5 bg-primary-50 hover:bg-primary-100 transition-colors"
                  title="Open in Naver Map"
                >
                  <Navigation className="h-3.5 w-3.5 text-primary-500" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
