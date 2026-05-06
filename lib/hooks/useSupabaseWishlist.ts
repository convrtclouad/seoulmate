"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

const TRIP_ID   = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const QUERY_KEY = ["wishlist_items", TRIP_ID];

export type WishlistCategory = "cafe" | "food" | "attraction" | "shopping" | "stay" | "other";

export interface WishlistItem {
  id:         string;
  trip_id:    string;
  name:       string;
  location:   string;
  category:   WishlistCategory;
  photo:      string | null;
  url:        string | null;
  notes:      string | null;
  visited:    boolean;
  created_by: string | null;
  created_at: string;
}

function genId() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

export function useWishlist() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await sb
        .from("wishlist_items")
        .select("*")
        .eq("trip_id", TRIP_ID)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as WishlistItem[];
    },
    staleTime: 0,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  }, [qc]);

  useEffect(() => {
    const ch = sb
      .channel(`wishlist_${TRIP_ID}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "wishlist_items",
        filter: `trip_id=eq.${TRIP_ID}`,
      }, refresh)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, refresh]);

  return query;
}

export function useAddWishlistItem() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (item: Omit<WishlistItem, "id" | "trip_id" | "visited" | "created_at" | "created_by">) => {
      const memberId = typeof window !== "undefined"
        ? (localStorage.getItem("seoulmate_user") ?? null)
        : null;
      const row = { id: genId(), trip_id: TRIP_ID, visited: false, created_by: memberId, ...item };
      const { data, error } = await sb.from("wishlist_items").insert(row).select().single();
      if (error) throw error;
      return data as WishlistItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useToggleVisited() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async ({ id, visited }: { id: string; visited: boolean }) => {
      const { error } = await sb.from("wishlist_items").update({ visited: !visited }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveWishlistItem() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("wishlist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
