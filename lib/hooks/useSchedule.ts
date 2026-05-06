"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Schedule, NewScheduleForm } from "@/types";

const LS_KEY = "seoulmate_schedules";
const QUERY_KEY = (tripId: string) => ["schedule", tripId];

function genId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function loadAll(): Schedule[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch { return []; }
}

function saveAll(items: Schedule[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export function useSchedule(tripId: string) {
  return useQuery({
    queryKey: QUERY_KEY(tripId),
    queryFn: () =>
      loadAll()
        .filter((s) => s.trip_id === tripId)
        .sort((a, b) => {
          const d = a.activity_date.localeCompare(b.activity_date);
          if (d !== 0) return d;
          return (a.start_time ?? "").localeCompare(b.start_time ?? "");
        }),
    staleTime: 0,
  });
}

export function useAddActivity(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: NewScheduleForm) => {
      const item: Schedule = {
        id: genId(),
        trip_id: tripId,
        title: form.title,
        description: form.description ?? null,
        category: form.category,
        activity_date: form.activity_date,
        start_time: form.start_time ?? null,
        end_time: form.end_time ?? null,
        place_name: form.place_name ?? null,
        address: form.address ?? null,
        lat: form.lat ?? null,
        lng: form.lng ?? null,
        photo_url: null,
        naver_place_id: null,
        kakao_place_id: null,
        created_by: localStorage.getItem("seoulmate_user") ?? "unknown",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const all = loadAll();
      all.push(item);
      saveAll(all);
      return item;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(tripId) }),
  });
}

export function useDeleteActivity(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      saveAll(loadAll().filter((s) => s.id !== activityId));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(tripId) }),
  });
}
