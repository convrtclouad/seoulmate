"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { getSupabaseClient, hasSupabase } from "@/lib/supabase/client";
import type { BookingType, Booking } from "@/lib/hooks/useBookings";

export type { BookingType, Booking };

const TRIP_ID   = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const QUERY_KEY = ["bookings", TRIP_ID];

function genId() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

function rowToBooking(row: Record<string, unknown>): Booking {
  const data = (row.data ?? {}) as Record<string, unknown>;
  return {
    id:         row.id as string,
    type:       row.type as BookingType,
    title:      row.title as string,
    created_at: row.created_at as string,
    ...data,
  } as Booking;
}

function bookingToRow(b: Omit<Booking, "id" | "created_at">, id: string) {
  const { type, title, ...rest } = b;
  return { id, trip_id: TRIP_ID, type, title, data: rest };
}

export function useBookings() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!hasSupabase()) { try { return JSON.parse(localStorage.getItem("seoulmate_bookings") ?? "[]") as Booking[]; } catch { return []; } }
      const { data, error } = await sb
        .from("bookings")
        .select("*")
        .eq("trip_id", TRIP_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToBooking);
    },
    staleTime: 0,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  }, [qc]);

  useEffect(() => {
    const ch = sb
      .channel(`bookings_${TRIP_ID}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "bookings",
        filter: `trip_id=eq.${TRIP_ID}`,
      }, refresh)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, refresh]);

  return query;
}

export function useAddBooking() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (b: Omit<Booking, "id" | "created_at">) => {
      if (!hasSupabase()) { const all = JSON.parse(localStorage.getItem("seoulmate_bookings") ?? "[]"); const item = { ...b, id: genId(), created_at: new Date().toISOString() } as Booking; all.unshift(item); localStorage.setItem("seoulmate_bookings", JSON.stringify(all)); return item; }
      const id  = genId();
      const row = bookingToRow(b, id);
      const { error } = await sb.from("bookings").insert(row);
      if (error) throw error;
      return { ...b, id, created_at: new Date().toISOString() } as Booking;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveBooking() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!hasSupabase()) { const all = JSON.parse(localStorage.getItem("seoulmate_bookings") ?? "[]").filter((b: Booking) => b.id !== id); localStorage.setItem("seoulmate_bookings", JSON.stringify(all)); return; }
      const { error } = await sb.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
