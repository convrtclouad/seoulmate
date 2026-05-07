"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { getSupabaseClient, hasSupabase } from "@/lib/supabase/client";
import { getDefaultPrepareItems } from "@/lib/data/defaultPrepareItems";

const TRIP_ID   = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const QUERY_KEY = ["prepare_items", TRIP_ID];

export type PrepareCategory = "todo" | "packing" | "wishlist" | "shopping";

export interface PrepareItem {
  id:         string;
  trip_id:    string;
  category:   PrepareCategory;
  text:       string;
  done:       boolean;
  assignees:  string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function genId() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

export function usePrepare() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!hasSupabase()) {
        try {
          const raw: PrepareItem[] = JSON.parse(localStorage.getItem("seoulmate_prepare") ?? "[]");
          if (raw.length === 0) {
            // First launch — seed default checklist for all 4 members
            const defaults = getDefaultPrepareItems(TRIP_ID);
            localStorage.setItem("seoulmate_prepare", JSON.stringify(defaults));
            return defaults;
          }
          return raw.map((i: PrepareItem & { assignee?: string }) => ({
            ...i, trip_id: TRIP_ID,
            assignees: i.assignees ?? (i.assignee ? [i.assignee] : []),
          })) as PrepareItem[];
        } catch { return getDefaultPrepareItems(TRIP_ID); }
      }
      const { data, error } = await sb
        .from("prepare_items")
        .select("*")
        .eq("trip_id", TRIP_ID)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as PrepareItem[];
    },
    staleTime: Infinity,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  }, [qc]);

  useEffect(() => {
    const ch = sb
      .channel(`prepare_${TRIP_ID}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "prepare_items",
        filter: `trip_id=eq.${TRIP_ID}`,
      }, refresh)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, refresh]);

  return query;
}

export function useAddPrepareItem() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (item: {
      category: PrepareCategory;
      text: string;
      assignees?: string[];
    }) => {
      if (!hasSupabase()) { const all = JSON.parse(localStorage.getItem("seoulmate_prepare") ?? "[]"); const newItem = { id: genId(), trip_id: TRIP_ID, category: item.category, text: item.text, done: false, assignees: item.assignees ?? [], created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; all.push(newItem); localStorage.setItem("seoulmate_prepare", JSON.stringify(all)); return newItem; }
      const memberId = typeof window !== "undefined"
        ? (localStorage.getItem("seoulmate_user") ?? null)
        : null;
      const row = {
        id:         genId(),
        trip_id:    TRIP_ID,
        category:   item.category,
        text:       item.text,
        done:       false,
        assignees:  item.assignees ?? [],
        created_by: memberId,
      };
      const { data, error } = await sb.from("prepare_items").insert(row).select().single();
      if (error) throw error;
      return data as PrepareItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useTogglePrepareItem() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      if (!hasSupabase()) { const all = JSON.parse(localStorage.getItem("seoulmate_prepare") ?? "[]").map((i: PrepareItem) => i.id === id ? { ...i, done: !done } : i); localStorage.setItem("seoulmate_prepare", JSON.stringify(all)); return; }
      const { error } = await sb
        .from("prepare_items")
        .update({ done: !done, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemovePrepareItem() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!hasSupabase()) { const all = JSON.parse(localStorage.getItem("seoulmate_prepare") ?? "[]").filter((i: PrepareItem) => i.id !== id); localStorage.setItem("seoulmate_prepare", JSON.stringify(all)); return; }
      const { error } = await sb.from("prepare_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
