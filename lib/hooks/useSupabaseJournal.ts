"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { getSupabaseClient, hasSupabase } from "@/lib/supabase/client";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";

export interface JournalPost {
  id:           string;
  trip_id:      string;
  date:         string;   // "YYYY-MM-DD"
  member_id:    string;
  member_name:  string;
  member_emoji: string;
  mood:         string;
  text:         string | null;
  photos:       string[]; // compressed base64 strings
  created_at:   string;
  updated_at:   string;
}

const qKey = (date: string) => ["journal_posts", TRIP_ID, date];
const qKeyAll = () => ["journal_posts", TRIP_ID];

export function useJournalPosts(date: string) {
  const qc = useQueryClient();
  const sb = getSupabaseClient();

  const query = useQuery({
    queryKey: qKey(date),
    queryFn: async () => {
      if (!hasSupabase()) return [];
      const { data, error } = await sb
        .from("journal_posts")
        .select("*")
        .eq("trip_id", TRIP_ID)
        .eq("date", date)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as JournalPost[];
    },
    staleTime: Infinity,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: qKeyAll() });
  }, [qc]);

  useEffect(() => {
    const ch = sb
      .channel(`journal_${TRIP_ID}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "journal_posts",
        filter: `trip_id=eq.${TRIP_ID}`,
      }, refresh)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, refresh]);

  return query;
}

/** All dates that have at least one post (for dot indicators on day picker) */
export function useJournalDates() {
  const sb = getSupabaseClient();
  return useQuery({
    queryKey: ["journal_dates", TRIP_ID],
    queryFn: async () => {
      if (!hasSupabase()) return [];
      const { data, error } = await sb
        .from("journal_posts")
        .select("date")
        .eq("trip_id", TRIP_ID);
      if (error) throw error;
      return [...new Set((data ?? []).map((r: { date: string }) => r.date))] as string[];
    },
    staleTime: 60_000,
  });
}

export function useUpsertJournalPost() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (post: {
      date: string;
      member_id: string;
      member_name: string;
      member_emoji: string;
      mood: string;
      text: string;
      photos: string[];
    }) => {
      if (!hasSupabase()) throw new Error("Supabase not configured");
      const { data, error } = await sb
        .from("journal_posts")
        .upsert(
          { ...post, trip_id: TRIP_ID, updated_at: new Date().toISOString() },
          { onConflict: "trip_id,date,member_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as JournalPost;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: qKey(data.date) });
      qc.invalidateQueries({ queryKey: ["journal_dates", TRIP_ID] });
    },
  });
}

export function useDeleteJournalPost() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      if (!hasSupabase()) return date;
      const { error } = await sb.from("journal_posts").delete().eq("id", id);
      if (error) throw error;
      return date;
    },
    onSuccess: (date) => {
      qc.invalidateQueries({ queryKey: qKey(date) });
      qc.invalidateQueries({ queryKey: ["journal_dates", TRIP_ID] });
    },
  });
}
