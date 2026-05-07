"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { getSupabaseClient, hasSupabase } from "@/lib/supabase/client";

const TRIP_ID   = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const QUERY_KEY = ["sb_members", TRIP_ID];

export interface Member {
  id:    string;
  name:  string;
  emoji: string;
  color: string;
}

export const EMOJI_OPTIONS = [
  "🐱","🐶","🐼","🐨","🐻","🦊","🐰","🐹",
  "🐮","🐷","🐸","🦁","🐯","🐻‍❄️","🦝","🦙",
  "🦥","🐧","🦆","🦋","🐬","🦄","🐺","🦔",
];
export const COLOR_OPTIONS = [
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-purple-500",
  "from-orange-400 to-amber-500",
  "from-rose-400 to-pink-500",
  "from-sky-400 to-blue-500",
  "from-yellow-400 to-orange-400",
  "from-fuchsia-400 to-pink-500",
  "from-teal-400 to-cyan-500",
];

const DEFAULT_MEMBERS: Member[] = [
  { id: "bryan",    name: "Bryan",     emoji: "🐻",  color: "from-emerald-400 to-teal-500"   },
  { id: "changyao", name: "Chang Yao", emoji: "🐼",  color: "from-violet-400 to-purple-500"  },
  { id: "mango",    name: "Mango",     emoji: "🦁",  color: "from-yellow-400 to-orange-400"  },
  { id: "jackson",  name: "Jackson",   emoji: "🦊",  color: "from-sky-400 to-blue-500"       },
];

function lsLoad(): Member[] {
  if (typeof window === "undefined") return DEFAULT_MEMBERS;
  try {
    const s = localStorage.getItem("seoulmate_members");
    return s ? JSON.parse(s) : DEFAULT_MEMBERS;
  } catch { return DEFAULT_MEMBERS; }
}

export function getMembersSync(): Member[] { return lsLoad(); }

export function useMembers() {
  const qc      = useQueryClient();
  const sb      = getSupabaseClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!hasSupabase()) return lsLoad();
      const { data, error } = await sb
        .from("members")
        .select("*")
        .eq("trip_id", TRIP_ID)
        .order("created_at");
      if (error || !data?.length) {
        // Seed from localStorage on first load
        const local = lsLoad();
        if (!error && local.length) {
          await sb.from("members").upsert(
            local.map((m) => ({ ...m, trip_id: TRIP_ID })),
            { onConflict: "id" }
          );
          return local;
        }
        return lsLoad();
      }
      return data as Member[];
    },
    staleTime: Infinity,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  }, [qc]);

  useEffect(() => {
    const channel = sb
      .channel("members_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `trip_id=eq.${TRIP_ID}` }, refresh)
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [sb, refresh]);

  return query;
}

export function useAddMember() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (m: Omit<Member, "id">) => {
      if (!hasSupabase()) { const id = m.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(); const member = { id, ...m }; const all = lsLoad(); all.push(member); localStorage.setItem("seoulmate_members", JSON.stringify(all)); return member; }
      const id = m.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
      const member = { id, ...m, trip_id: TRIP_ID };
      const { error } = await sb.from("members").insert(member);
      if (error) throw error;
      return member as Member;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!hasSupabase()) { const all = lsLoad().filter((x) => x.id !== id); localStorage.setItem("seoulmate_members", JSON.stringify(all)); return; }
      const { error } = await sb.from("members").delete().eq("id", id).eq("trip_id", TRIP_ID);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
