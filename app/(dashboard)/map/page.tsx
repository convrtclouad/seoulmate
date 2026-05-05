"use client";

import { Header } from "@/components/layout/Header";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { SocialMap } from "@/components/map/SocialMap";
import { useMembers } from "@/lib/hooks/useMembers";
import { useEffect, useState } from "react";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";

export default function MapPage() {
  const { data: members = [] } = useMembers();
  const [currentId, setCurrentId] = useState("bryan");

  useEffect(() => {
    setCurrentId(localStorage.getItem("seoulmate_user") ?? members[0]?.id ?? "");
  }, [members]);

  const profiles = members.map((m) => ({
    id: m.id,
    display_name: m.name,
    avatar_url: null,
    phone: null,
    last_lat: null,
    last_lng: null,
    last_checkin: null,
    created_at: "",
    updated_at: "",
  }));

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <Header title="地图 & 天气" />

      <div className="px-4 py-4 space-y-5 pb-safe">
        <WeatherWidget />

        <div>
          <h2 className="section-title mb-3">首尔景点地图</h2>
          <SocialMap tripId={TRIP_ID} currentUserId={currentId} profiles={profiles} />
        </div>
      </div>
    </div>
  );
}
