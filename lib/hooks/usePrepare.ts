"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type PrepareCategory = "todo" | "packing" | "wishlist" | "shopping";

export interface PrepareItem {
  id: string;
  category: PrepareCategory;
  text: string;
  done: boolean;
  assignees: string[]; // member ids — empty = everyone
  created_at: string;
}

const LS_KEY = "seoulmate_prepare";
const QUERY_KEY = ["prepare"];

function genId() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

function load(): PrepareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    // Migrate old items that used `assignee` (single string) → `assignees` (array)
    return raw.map((i: PrepareItem & { assignee?: string }) => ({
      ...i,
      assignees: i.assignees ?? (i.assignee ? [i.assignee] : []),
    }));
  } catch { return []; }
}

function save(items: PrepareItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export function usePrepare() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: load, staleTime: 0 });
}

export function useAddPrepareItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { category: PrepareCategory; text: string; assignees?: string[] }) => {
      const all = load();
      const newItem: PrepareItem = {
        id: genId(),
        category: item.category,
        text: item.text,
        done: false,
        assignees: item.assignees ?? [],
        created_at: new Date().toISOString(),
      };
      all.push(newItem);
      save(all);
      return newItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useTogglePrepareItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const all = load().map((i) => i.id === id ? { ...i, done: !i.done } : i);
      save(all);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemovePrepareItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { save(load().filter((i) => i.id !== id)); },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
