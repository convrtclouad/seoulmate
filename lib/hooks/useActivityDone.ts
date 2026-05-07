"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { getSupabaseClient, hasSupabase } from "@/lib/supabase/client";

const TRIP_ID   = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const LS_KEY    = "seoulmate_done_activities";
const QUERY_KEY = ["activity_done", TRIP_ID];

function lsGetDone(): Set<string> {
  try { return new Set<string>(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]")); }
  catch { return new Set(); }
}
function lsSetDone(set: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]));
}

/** Returns the set of activity IDs completed by the current member */
export function useActivityDone() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  const memberId = typeof window !== "undefined"
    ? (localStorage.getItem("seoulmate_user") ?? "unknown")
    : "unknown";

  const query = useQuery({
    queryKey: [...QUERY_KEY, memberId],
    queryFn: async (): Promise<Set<string>> => {
      if (!hasSupabase()) return lsGetDone();
      const { data, error } = await sb
        .from("activity_done")
        .select("activity_id")
        .eq("trip_id", TRIP_ID)
        .eq("member_id", memberId);
      if (error) return lsGetDone();
      return new Set((data ?? []).map((r: { activity_id: string }) => r.activity_id));
    },
    staleTime: Infinity,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: [...QUERY_KEY, memberId] });
  }, [qc, memberId]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const ch = sb
      .channel(`activity_done_${TRIP_ID}_${memberId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "activity_done",
        filter: `trip_id=eq.${TRIP_ID}`,
      }, refresh)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, memberId, refresh]);

  const toggle = useMutation({
    mutationFn: async (activityId: string) => {
      const done = query.data ?? new Set<string>();
      const isDone = done.has(activityId);

      if (!hasSupabase()) {
        const next = new Set(done);
        if (isDone) next.delete(activityId); else next.add(activityId);
        lsSetDone(next);
        return;
      }

      if (isDone) {
        await sb.from("activity_done")
          .delete()
          .eq("activity_id", activityId)
          .eq("trip_id", TRIP_ID)
          .eq("member_id", memberId);
      } else {
        await sb.from("activity_done")
          .upsert({ activity_id: activityId, trip_id: TRIP_ID, member_id: memberId },
                  { onConflict: "activity_id,member_id" });
      }
    },
    onSuccess: () => refresh(),
  });

  return { done: query.data ?? new Set<string>(), toggle: toggle.mutate };
}
