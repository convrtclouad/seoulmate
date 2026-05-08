"use client";

import { useEffect, useRef } from "react";
import { getSupabaseClient, hasSupabase } from "@/lib/supabase/client";
import { fireToast } from "@/components/ui/NotificationToast";
import { getMembersSync } from "@/lib/hooks/useSupabaseMembers";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";

const CAT_EMOJI: Record<string, string> = {
  food: "🍜", transport: "🚇", shopping: "🛍️",
  accommodation: "🏨", entertainment: "🎡", health: "💊", other: "💳",
};

/** Request browser notification permission once */
function requestPermission() {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

/** Show native browser notification when page is hidden */
function nativeNotify(title: string, body: string, icon?: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return; // only when app is in background
  try {
    new Notification(title, { body, icon: icon ?? "/icon-192.png", silent: false });
  } catch {}
}

export function useRealtimeNotifications() {
  const sb = getSupabaseClient();
  // Store current user id in a ref so it's always fresh inside callbacks
  const currentIdRef = useRef<string>("");

  useEffect(() => {
    currentIdRef.current = localStorage.getItem("seoulmate_user") ?? "";
    requestPermission();
  }, []);

  useEffect(() => {
    if (!hasSupabase()) return;

    // ── Expense INSERT listener ──────────────────────────────────
    const expCh = sb
      .channel("notify_expenses")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trip_expenses", filter: `trip_id=eq.${TRIP_ID}` },
        (payload) => {
          const row = payload.new as {
            paid_by: string; title: string; amount_krw: number;
            amount_myr: number | null; category: string; exchange_rate: number | null;
          };

          // Don't notify yourself
          if (row.paid_by === currentIdRef.current) return;

          const members = getMembersSync();
          const payer = members.find((m) => m.id === row.paid_by);
          const payerName = payer ? `${payer.emoji} ${payer.name}` : row.paid_by;
          const catEmoji = CAT_EMOJI[row.category] ?? "💳";

          // Calculate MYR from exchange_rate stored with the expense
          let myrStr = "";
          if (row.amount_myr) {
            myrStr = ` (≈ RM ${row.amount_myr.toFixed(0)})`;
          } else if (row.exchange_rate && row.exchange_rate > 0) {
            myrStr = ` (≈ RM ${(row.amount_krw / row.exchange_rate).toFixed(0)})`;
          }

          const title = `${payerName} 付了款！`;
          const body = `${catEmoji} ${row.title} · ₩${row.amount_krw.toLocaleString("ko-KR")}${myrStr}`;

          fireToast({ emoji: payer?.emoji ?? "💰", title, body, type: "expense" });
          nativeNotify(title, body);
        }
      )
      .subscribe();

    // ── Journal INSERT listener ──────────────────────────────────
    const journalCh = sb
      .channel("notify_journal")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "journal_posts", filter: `trip_id=eq.${TRIP_ID}` },
        (payload) => {
          const row = payload.new as {
            member_id: string; member_name: string; member_emoji: string; mood: string; text: string | null;
          };

          // Don't notify yourself
          if (row.member_id === currentIdRef.current) return;

          const title = `${row.member_emoji} ${row.member_name} 发了日记 ${row.mood}`;
          const preview = row.text ? row.text.slice(0, 60) + (row.text.length > 60 ? "…" : "") : "（照片日记）";

          fireToast({ emoji: row.member_emoji, title, body: preview, type: "journal" });
          nativeNotify(title, preview);
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(expCh);
      sb.removeChannel(journalCh);
    };
  }, [sb]);
}
