"use client";

import { format, parseISO } from "date-fns";
import {
  MapPin, Clock, Trash2,
  Utensils, Car, Hotel, Camera, ShoppingBag, HelpCircle, Navigation, CheckCircle2, Circle,
} from "lucide-react";
import type { Schedule, ActivityCategory } from "@/types";
import { cn } from "@/lib/utils/cn";
import { useActivityDone } from "@/lib/hooks/useActivityDone";

const CATEGORY_CONFIG: Record<
  ActivityCategory,
  { icon: React.ElementType; color: string; bg: string; label: string; labelCn: string; vibe: string }
> = {
  transport:     { icon: Car,         color: "text-blue-500",   bg: "bg-blue-100",   label: "Transport",   labelCn: "交通",   vibe: "🚄 交通出行" },
  food:          { icon: Utensils,    color: "text-orange-500", bg: "bg-orange-100", label: "Food",        labelCn: "餐饮",   vibe: "🍽️ 吃喝打卡" },
  attraction:    { icon: Camera,      color: "text-purple-500", bg: "bg-purple-100", label: "Attraction",  labelCn: "景点",   vibe: "📸 拍照观光" },
  accommodation: { icon: Hotel,       color: "text-indigo-500", bg: "bg-indigo-100", label: "Stay",        labelCn: "住宿",   vibe: "🏠 住宿休息" },
  shopping:      { icon: ShoppingBag, color: "text-pink-500",   bg: "bg-pink-100",   label: "Shopping",    labelCn: "购物",   vibe: "🛍️ 购物逛街" },
  other:         { icon: HelpCircle,  color: "text-gray-400",   bg: "bg-gray-100",   label: "Other",       labelCn: "其他",   vibe: "🎉 娱乐玩乐" },
};


interface TimelineItemProps {
  activity: Schedule;
  isLast?: boolean;
  onDelete?: (id: string) => void;
}

function openNaverSearch(placeName: string, lat?: number | null, lng?: number | null) {
  if (lat && lng) {
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(placeName)}?c=${lng},${lat},15,0,0,0,dh`, "_blank");
  } else {
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(placeName)}`, "_blank");
  }
}

export function TimelineItem({ activity, isLast = false, onDelete }: TimelineItemProps) {
  const config = CATEGORY_CONFIG[activity.category] ?? CATEGORY_CONFIG.other;
  const Icon   = config.icon;
  const { done: doneSet, toggle } = useActivityDone();
  const done = doneSet.has(activity.id);

  function handleToggleDone() {
    toggle(activity.id);
  }

  return (
    <div className="flex gap-3 group animate-slide-up">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-opacity",
          config.bg,
          done && "opacity-40"
        )}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
        {!isLast && (
          <div className="flex-1 w-0.5 bg-gradient-to-b from-gray-200 to-transparent mt-1 min-h-[1.5rem]" />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 pb-4">
        <div className={cn("card overflow-hidden !p-0 transition-opacity", done && "opacity-60")}>
          {/* Photo banner */}
          {activity.photo_url && (
            <div className="relative h-28 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activity.photo_url}
                alt={activity.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {/* Done overlay */}
              {done && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-white drop-shadow" />
                </div>
              )}
              {/* Time badge */}
              {activity.start_time && (
                <div className="absolute bottom-2 left-3 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5">
                  <Clock className="h-3 w-3 text-white/80" />
                  <span className="text-[10px] text-white font-bold">
                    {format(parseISO(`2000-01-01T${activity.start_time}`), "h:mm a")}
                    {activity.end_time && ` – ${format(parseISO(`2000-01-01T${activity.end_time}`), "h:mm a")}`}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="p-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={cn("font-bold text-gray-900 text-sm leading-tight", done && "line-through text-gray-400")}>
                  {activity.title}
                </h3>
                {/* Vibe tag */}
                <span className={cn("badge mt-1 text-[10px]", config.bg, config.color)}>
                  {config.vibe}
                </span>
              </div>

              {/* Time (only if no photo) */}
              {!activity.photo_url && activity.start_time && (
                <div className="flex items-center gap-1 shrink-0 text-xs text-gray-400 font-medium">
                  <Clock className="h-3 w-3" />
                  {format(parseISO(`2000-01-01T${activity.start_time}`), "h:mm a")}
                  {activity.end_time && (
                    <> {" – "}{format(parseISO(`2000-01-01T${activity.end_time}`), "h:mm a")}</>
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
              <div className="flex items-center gap-1.5 mt-2">
                <MapPin className="h-3.5 w-3.5 text-primary-400 shrink-0" />
                <p className="text-xs text-gray-500 truncate">{activity.place_name}</p>
              </div>
            )}

            {/* Actions row */}
            <div className="flex items-center gap-2 mt-3">
              {/* Complete toggle */}
              <button
                onClick={handleToggleDone}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                  done
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                )}
              >
                {done
                  ? <><CheckCircle2 className="h-3.5 w-3.5" />已完成</>
                  : <><Circle className="h-3.5 w-3.5" />完成</>
                }
              </button>

              {/* Naver nav */}
              {activity.place_name && (
                <button
                  onClick={() => openNaverSearch(activity.place_name!, activity.lat, activity.lng)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors"
                  style={{ background: "#03C75A", color: "#fff" }}
                >
                  <Navigation className="h-3.5 w-3.5" />
                  导航
                </button>
              )}

              {/* Delete */}
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
    </div>
  );
}
