"use client";

import { Header } from "@/components/layout/Header";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { SocialMap } from "@/components/map/SocialMap";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const MOCK_PROFILES = [
  { id: "user-1", display_name: "Bryan",  avatar_url: null, phone: null, last_lat: null, last_lng: null, last_checkin: null, created_at: "", updated_at: "" },
  { id: "user-2", display_name: "Sarah",  avatar_url: null, phone: null, last_lat: null, last_lng: null, last_checkin: null, created_at: "", updated_at: "" },
  { id: "user-3", display_name: "Mike",   avatar_url: null, phone: null, last_lat: null, last_lng: null, last_checkin: null, created_at: "", updated_at: "" },
  { id: "user-4", display_name: "Priya",  avatar_url: null, phone: null, last_lat: null, last_lng: null, last_checkin: null, created_at: "", updated_at: "" },
];
const CURRENT_USER_ID = "user-1";

export default function MapPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header title="Map & Weather" />

      <div className="px-4 py-4 space-y-5 pb-safe">
        <WeatherWidget />

        <div>
          <h2 className="section-title mb-3">Friend Locations</h2>
          <SocialMap
            tripId={TRIP_ID}
            currentUserId={CURRENT_USER_ID}
            profiles={MOCK_PROFILES}
          />
        </div>
      </div>
    </div>
  );
}
