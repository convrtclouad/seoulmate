"use client";

import { format, parseISO } from "date-fns";
import {
  MapPin, Navigation, Clock, Trash2,
  Utensils, Car, Hotel, Camera, ShoppingBag, HelpCircle,
} from "lucide-react";
import { openNaverMap } from "@/lib/utils/maps";
import type { Schedule, ActivityCategory } from "@/types";
import { cn } from "@/lib/utils/cn";

const CATEGORY_CONFIG: Record<
  ActivityCategory,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  transport:     { icon: Car,       color: "text-blue-500",   bg: "bg-blue-100",   label: "Transport" },
  food:          { icon: Utensils,  color: "text-orange-500", bg: "bg-orange-100", label: "Food & Drink" },
  attraction:    { icon: Camera,    color: "text-purple-500", bg: "bg-purple-100", label: "Attraction" },
  accommodation: { icon: Hotel,     color: "text-indigo-500", bg: "bg-indigo-100", label: "Stay" },
  shopping:      { icon: ShoppingBag, color: "text-pink-500", bg: "bg-pink-100",   label: "Shopping" },
  other:         { icon: HelpCircle, color: "text-gray-400",  bg: "bg-gray-100",   label: "Other" },
};

interface TimelineItemProps {
  activity: Schedule;
  isLast?: boolean;
  onDelete?: (id: string) => void;
}

export function TimelineItem({ activity, isLast = false, onDelete }: TimelineItemProps) {
  const config = CATEGORY_CONFIG[activity.category];
  const Icon   = config.icon;

  const hasLocation = activity.lat !== null && activity.lng !== null;

  function handleGetThere() {
    if (!hasLocation) return;
    openNaverMap({
      lat:          activity.lat!,
      lng:          activity.lng!,
      name:         activity.place_name ?? activity.title,
      naverPlaceId: activity.naver_place_id ?? undefined,
    });
  }

  return (
    <div className="flex gap-3 group animate-slide-up">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 z-10",
          config.bg
        )}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
        {!isLast && (
          <div className="flex-1 w-0.5 bg-gradient-to-b from-gray-200 to-transparent mt-1 min-h-[1.5rem]" />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 pb-4">
        <div className="card">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm leading-tight">
                {activity.title}
              </h3>
              <span className={cn(
                "badge mt-1",
                config.bg,
                config.color
              )}>
                {config.label}
              </span>
            </div>

            {/* Time */}
            {activity.start_time && (
              <div className="flex items-center gap-1 shrink-0 text-xs text-gray-400 font-medium">
                <Clock className="h-3 w-3" />
                {format(parseISO(`2000-01-01T${activity.start_time}`), "h:mm a")}
                {activity.end_time && (
                  <>
                    {" – "}
                    {format(parseISO(`2000-01-01T${activity.end_time}`), "h:mm a")}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {activity.description && (
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              {activity.description}
            </p>
          )}

          {/* Location row */}
          {activity.place_name && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <MapPin className="h-3.5 w-3.5 text-primary-400 shrink-0" />
              <p className="text-xs text-gray-500 truncate">{activity.place_name}</p>
              {activity.address && (
                <span className="text-xs text-gray-300 truncate">· {activity.address}</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {hasLocation && (
              <button
                onClick={handleGetThere}
                className="flex items-center gap-1.5 rounded-xl bg-primary-50 border border-primary-100 px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-100 transition-colors tap-target"
              >
                <Navigation className="h-3.5 w-3.5" />
                Get there
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(activity.id)}
                className="ml-auto rounded-xl p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 tap-target"
                aria-label="Delete activity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
