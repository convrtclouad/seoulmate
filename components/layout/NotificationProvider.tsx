"use client";

import { NotificationToast } from "@/components/ui/NotificationToast";
import { useRealtimeNotifications } from "@/lib/hooks/useRealtimeNotifications";

export function NotificationProvider() {
  useRealtimeNotifications();
  return <NotificationToast />;
}
