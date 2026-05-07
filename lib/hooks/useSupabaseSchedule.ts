"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { getSupabaseClient, hasSupabase } from "@/lib/supabase/client";
import { getDefaultActivities } from "@/lib/data/defaultActivities";
import type { Schedule, NewScheduleForm } from "@/types";

const TRIP_ID   = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const QUERY_KEY = ["activities", TRIP_ID];

function genId() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

export function useSchedule(_tripId?: string) {
  const qc = useQueryClient();
  const sb = getSupabaseClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const defaults = getDefaultActivities(TRIP_ID);
      const sortFn = (a: Schedule, b: Schedule) =>
        a.activity_date.localeCompare(b.activity_date) || (a.start_time ?? "").localeCompare(b.start_time ?? "");

      if (!hasSupabase()) {
        try {
          const all = JSON.parse(localStorage.getItem("seoulmate_schedules") ?? "[]") as Schedule[];
          // Keep defaults + any user-added activities (non-seed IDs)
          const userAdded = all.filter((s) => s.trip_id === TRIP_ID && !s.id.startsWith("seed-"));
          return [...defaults, ...userAdded].sort(sortFn);
        } catch {
          return defaults;
        }
      }
      const { data, error } = await sb
        .from("activities")
        .select("*")
        .eq("trip_id", TRIP_ID)
        .order("activity_date")
        .order("start_time");
      if (error) throw error;
      const activities = (data ?? []).map((row) => ({
        id:            row.id,
        trip_id:       row.trip_id,
        title:         row.title,
        description:   row.description,
        category:      row.category,
        activity_date: row.activity_date,
        start_time:    row.start_time,
        end_time:      row.end_time,
        place_name:    row.place_name,
        address:       row.address,
        photo_url:     row.photo_url ?? null,
        naver_place_id: null,
        kakao_place_id: null,
        created_by:    row.created_by ?? "unknown",
        created_at:    row.created_at,
        updated_at:    row.updated_at ?? row.created_at,
        lat:           row.lat ?? null,
        lng:           row.lng ?? null,
      })) as Schedule[];
      // Always use hardcoded defaults for seed activities (they have photos + lat/lng)
      // Only pull user-added activities from the DB
      const userAddedInDb = activities.filter((a) => a.created_by !== "seed");
      return [...defaults, ...userAddedInDb].sort(sortFn);
    },
    staleTime: Infinity,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  }, [qc]);

  useEffect(() => {
    const ch = sb
      .channel(`activities_${TRIP_ID}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "activities",
        filter: `trip_id=eq.${TRIP_ID}`,
      }, refresh)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, refresh]);

  return query;
}

export function useAddActivity(_tripId?: string) {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (form: NewScheduleForm) => {
      if (!hasSupabase()) { const all = JSON.parse(localStorage.getItem("seoulmate_schedules") ?? "[]"); const item = { id: genId(), trip_id: TRIP_ID, title: form.title, description: form.description ?? null, category: form.category, activity_date: form.activity_date, start_time: form.start_time ?? null, end_time: form.end_time ?? null, place_name: form.place_name ?? null, address: form.address ?? null, naver_place_id: null, kakao_place_id: null, created_by: typeof window !== "undefined" ? (localStorage.getItem("seoulmate_user") ?? "unknown") : "unknown", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), lat: null, lng: null }; all.push(item); localStorage.setItem("seoulmate_schedules", JSON.stringify(all)); return item; }
      const memberId = typeof window !== "undefined"
        ? (localStorage.getItem("seoulmate_user") ?? "unknown")
        : "unknown";
      const row = {
        id:            genId(),
        trip_id:       TRIP_ID,
        title:         form.title,
        description:   form.description ?? null,
        category:      form.category,
        activity_date: form.activity_date,
        start_time:    form.start_time ?? null,
        end_time:      form.end_time ?? null,
        place_name:    form.place_name ?? null,
        address:       form.address ?? null,
        created_by:    memberId,
      };
      const { data, error } = await sb.from("activities").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteActivity(_tripId?: string) {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!hasSupabase()) { const all = JSON.parse(localStorage.getItem("seoulmate_schedules") ?? "[]").filter((s: Schedule) => s.id !== id); localStorage.setItem("seoulmate_schedules", JSON.stringify(all)); return; }
      const { error } = await sb.from("activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
