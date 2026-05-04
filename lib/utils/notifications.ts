// ─── Browser Push Notifications ──────────────────────────────────────────────
import type { Schedule } from "@/types";
import { format, parseISO, differenceInMinutes } from "date-fns";

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function scheduleActivityReminder(activity: Schedule): (() => void) | null {
  if (!activity.start_time || !activity.activity_date) return null;

  const activityDateTime = parseISO(
    `${activity.activity_date}T${activity.start_time}`
  );
  const now = new Date();
  const msUntilReminder =
    differenceInMinutes(activityDateTime, now) * 60 * 1000 - 15 * 60 * 1000;

  if (msUntilReminder <= 0) return null; // already past or too soon

  const timerId = window.setTimeout(async () => {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    new Notification(`⏰ Coming up: ${activity.title}`, {
      body: `Starts at ${format(activityDateTime, "h:mm a")}${
        activity.place_name ? ` · ${activity.place_name}` : ""
      }`,
      icon:  "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      tag:  `activity-${activity.id}`,
      data: { activityId: activity.id },
    });
  }, msUntilReminder);

  // Return a cleanup function
  return () => clearTimeout(timerId);
}

/**
 * Register reminders for all upcoming activities in a schedule list.
 * Returns a cleanup function that cancels all pending timers.
 */
export function registerAllReminders(activities: Schedule[]): () => void {
  const cleanups: Array<() => void> = [];

  for (const activity of activities) {
    const cleanup = scheduleActivityReminder(activity);
    if (cleanup) cleanups.push(cleanup);
  }

  return () => cleanups.forEach((fn) => fn());
}
