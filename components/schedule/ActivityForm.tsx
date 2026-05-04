"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import type { ActivityCategory, NewScheduleForm } from "@/types";
import { cn } from "@/lib/utils/cn";

const CATEGORIES: { value: ActivityCategory; label: string; emoji: string }[] = [
  { value: "food",          label: "Food",      emoji: "🍜" },
  { value: "attraction",    label: "Sight",     emoji: "📸" },
  { value: "transport",     label: "Transport", emoji: "🚇" },
  { value: "accommodation", label: "Hotel",     emoji: "🏨" },
  { value: "shopping",      label: "Shop",      emoji: "🛍️" },
  { value: "other",         label: "Other",     emoji: "📌" },
];

interface ActivityFormProps {
  onSubmit: (form: NewScheduleForm) => Promise<void>;
  onCancel: () => void;
  defaultDate?: string;
}

export function ActivityForm({ onSubmit, onCancel, defaultDate }: ActivityFormProps) {
  const [category, setCategory] = useState<ActivityCategory>("attraction");
  const [title, setTitle]         = useState("");
  const [description, setDesc]    = useState("");
  const [date, setDate]           = useState(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStart]     = useState("09:00");
  const [endTime, setEnd]         = useState("");
  const [placeName, setPlace]     = useState("");
  const [address, setAddress]     = useState("");
  const [lat, setLat]             = useState("");
  const [lng, setLng]             = useState("");
  const [loading, setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        title,
        description:   description || undefined,
        category,
        activity_date: date,
        start_time:    startTime || undefined,
        end_time:      endTime   || undefined,
        place_name:    placeName || undefined,
        address:       address   || undefined,
        lat:           lat  ? parseFloat(lat)  : undefined,
        lng:           lng  ? parseFloat(lng)  : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Category */}
      <div>
        <label className="label">Type</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-all",
                category === value
                  ? "bg-primary-500 text-white border-primary-500"
                  : "bg-white text-gray-600 border-gray-200"
              )}
            >
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="label">Activity</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Gyeongbokgung Palace visit"
          required
          className="input"
        />
      </div>

      {/* Description */}
      <div>
        <label className="label">Notes (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Tips, notes, reservations..."
          rows={2}
          className="input resize-none"
        />
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Start time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStart(e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">End time (optional)</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEnd(e.target.value)}
          className="input"
        />
      </div>

      {/* Location */}
      <div>
        <label className="label">Place name</label>
        <input
          type="text"
          value={placeName}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="e.g. Gyeongbokgung Palace"
          className="input"
        />
      </div>
      <div>
        <label className="label">Address (optional)</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. Sejong-daero, Jongno-gu"
          className="input"
        />
      </div>

      {/* Coords (for deep link) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Latitude</label>
          <input
            type="number"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="37.5796"
            step="any"
            className="input font-mono"
          />
        </div>
        <div>
          <label className="label">Longitude</label>
          <input
            type="number"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="126.9770"
            step="any"
            className="input font-mono"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Add Activity
        </Button>
      </div>
    </form>
  );
}
