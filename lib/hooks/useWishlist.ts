"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type WishlistCategory = "cafe" | "food" | "attraction" | "shopping" | "stay" | "other";

export interface WishlistItem {
  id: string;
  name: string;
  location: string;        // city / area label
  category: WishlistCategory;
  photo?: string;          // base64 data-url
  url?: string;            // external link
  notes?: string;
  visited: boolean;
  created_at: string;
}

const LS_KEY    = "seoulmate_wishlist";
const QUERY_KEY = ["wishlist"];

function genId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function load(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); }
  catch { return []; }
}

function save(items: WishlistItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export function useWishlist() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: load, staleTime: 0 });
}

export function useAddWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<WishlistItem, "id" | "visited" | "created_at">) => {
      const all = load();
      const newItem: WishlistItem = {
        ...item, id: genId(), visited: false, created_at: new Date().toISOString(),
      };
      all.push(newItem);
      save(all);
      return newItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useToggleVisited() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const all = load().map((i) => i.id === id ? { ...i, visited: !i.visited } : i);
      save(all);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { save(load().filter((i) => i.id !== id)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
