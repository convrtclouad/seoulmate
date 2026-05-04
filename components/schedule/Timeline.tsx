"use client";

import { format, parseISO, isToday } from "date-fns";
import { CalendarDays } from "lucide-react";
import { TimelineItem } from "./TimelineItem";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Schedule } from "@/types";

interface TimelineProps {
  activities: Schedule[];
  onDelete?: (id: string) => void;
}

export function Timeline({ activities, onDelete }: TimelineProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays className="h-10 w-10" />}
        title="No activities yet"
        description="Add your first activity to build your Korea itinerary."
      />
    );
  }

  // Group by date
  const grouped = activities.reduce<Record<string, Schedule[]>>((acc, act) => {
    (acc[act.activity_date] ??= []).push(act);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const dayActivities = grouped[date];
        const parsedDate    = parseISO(date);
        const today         = isToday(parsedDate);

        return (
          <div key={date}>
            {/* Day header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`rounded-2xl px-3 py-1.5 ${
                today
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}>
                <p className="text-xs font-bold uppercase tracking-wide">
                  {format(parsedDate, "EEE")}
                </p>
                <p className="text-xl font-black leading-none">
                  {format(parsedDate, "d")}
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  {format(parsedDate, "MMMM yyyy")}
                </p>
                {today && (
                  <span className="badge bg-primary-100 text-primary-600 text-[10px]">
                    Today
                  </span>
                )}
              </div>
            </div>

            {/* Activities for this day */}
            {dayActivities.map((activity, idx) => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                isLast={idx === dayActivities.length - 1}
                onDelete={onDelete}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
