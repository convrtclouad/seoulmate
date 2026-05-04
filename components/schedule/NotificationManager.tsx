"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  requestNotificationPermission,
  registerAllReminders,
} from "@/lib/utils/notifications";
import type { Schedule } from "@/types";

interface NotificationManagerProps {
  activities: Schedule[];
}

export function NotificationManager({ activities }: NotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;
    const cleanup = registerAllReminders(activities);
    return cleanup;
  }, [activities, permission]);

  async function handleEnable() {
    const granted = await requestNotificationPermission();
    setPermission(granted ? "granted" : "denied");
  }

  if (!("Notification" in window)) return null;
  if (permission === "granted") return null;  // quietly registered

  return (
    <button
      onClick={handleEnable}
      disabled={permission === "denied"}
      className="flex items-center gap-2 rounded-2xl border border-dashed border-primary-200
                 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-600
                 hover:bg-primary-100 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {permission === "denied" ? (
        <>
          <BellOff className="h-4 w-4 shrink-0" />
          <span>Notifications blocked — enable in browser settings</span>
        </>
      ) : (
        <>
          <Bell className="h-4 w-4 shrink-0" />
          <span>Enable 15-min activity reminders</span>
        </>
      )}
    </button>
  );
}
