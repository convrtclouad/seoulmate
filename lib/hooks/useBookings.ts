"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type BookingType = "flight" | "hotel" | "rental" | "voucher";

export interface Booking {
  id: string;
  type: BookingType;
  title: string;
  // Flight fields
  airline?: string;
  flight_no?: string;
  departure_code?: string;
  arrival_code?: string;
  departure_time?: string;
  arrival_time?: string;
  travel_date?: string;
  // Hotel fields
  check_in?: string;
  check_out?: string;
  address?: string;
  // Common
  confirmation_no?: string;
  price?: string;
  currency?: string;
  notes?: string;
  created_at: string;
}

const LS_KEY = "seoulmate_bookings";
const QUERY_KEY = ["bookings"];

function genId() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
function load(): Booking[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); }
  catch { return []; }
}
function save(items: Booking[]) { localStorage.setItem(LS_KEY, JSON.stringify(items)); }

export function useBookings() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: load, staleTime: 0 });
}

export function useAddBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: Omit<Booking, "id" | "created_at">) => {
      const all = load();
      const item: Booking = { ...b, id: genId(), created_at: new Date().toISOString() };
      all.unshift(item);
      save(all);
      return item;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { save(load().filter((b) => b.id !== id)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
