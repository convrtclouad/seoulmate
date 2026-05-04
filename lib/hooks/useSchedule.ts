"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { cacheItems, getCachedItems } from "@/lib/utils/offline-cache";
import type { Schedule, NewScheduleForm } from "@/types";

const QUERY_KEY = (tripId: string) => ["schedule", tripId];

async function fetchSchedule(tripId: string): Promise<Schedule[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("trip_id", tripId)
    .order("activity_date", { ascending: true })
    .order("start_time",    { ascending: true });

  if (error) throw error;
  const items = data as Schedule[];
  await cacheItems("schedules", items);
  return items;
}

export function useSchedule(tripId: string) {
  return useQuery({
    queryKey: QUERY_KEY(tripId),
    queryFn:  () => fetchSchedule(tripId),
    placeholderData: () => {
      if (typeof window !== "undefined") {
        let cached: Schedule[] = [];
        getCachedItems<Schedule>("schedules").then((items) => {
          cached = items.filter((s) => s.trip_id === tripId);
        });
        return cached.length > 0 ? cached : undefined;
      }
    },
  });
}

export function useAddActivity(tripId: string) {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (form: NewScheduleForm) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("schedules")
        .insert({ ...form, trip_id: tripId, created_by: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as Schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(tripId) });
    },
  });
}

export function useDeleteActivity(tripId: string) {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", activityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(tripId) });
    },
  });
}
