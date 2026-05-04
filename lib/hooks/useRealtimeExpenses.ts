"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase Realtime for the expenses table.
 * Invalidates the React Query cache on any INSERT/UPDATE/DELETE,
 * so all connected friends see changes instantly.
 */
export function useRealtimeExpenses(tripId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`expenses:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expense_splits",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, queryClient]);
}
