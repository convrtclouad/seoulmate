"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { cacheItems, getCachedItems } from "@/lib/utils/offline-cache";
import { fetchExchangeRate, krwToMyr } from "@/lib/utils/currency";
import type { Expense, NewExpenseForm, ExpenseSplit } from "@/types";
import { calculateEqualSplits, calculateCustomSplits } from "@/lib/utils/expense-splitter";

const QUERY_KEY = (tripId: string) => ["expenses", tripId];

async function fetchExpenses(tripId: string): Promise<Expense[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(`
      *,
      paid_by_profile:profiles!expenses_paid_by_fkey(*),
      splits:expense_splits(*, profile:profiles(*))
    `)
    .eq("trip_id", tripId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  const expenses = data as Expense[];
  await cacheItems("expenses", expenses);
  return expenses;
}

export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: QUERY_KEY(tripId),
    queryFn:  () => fetchExpenses(tripId),
    placeholderData: () => {
      // Return cached data while re-fetching (offline-first)
      if (typeof window !== "undefined") {
        let cached: Expense[] = [];
        getCachedItems<Expense>("expenses").then((items) => {
          cached = items.filter((e) => e.trip_id === tripId);
        });
        return cached.length > 0 ? cached : undefined;
      }
    },
  });
}

export function useAddExpense(tripId: string) {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (form: NewExpenseForm) => {
      const rate = await fetchExchangeRate();
      const amountMyr = krwToMyr(form.amount_krw, rate);

      // 1. Insert expense
      const { data: expense, error: expErr } = await supabase
        .from("expenses")
        .insert({
          trip_id:       tripId,
          title:         form.title,
          category:      form.category,
          amount_krw:    form.amount_krw,
          amount_myr:    amountMyr,
          exchange_rate: rate,
          paid_by:       form.paid_by,
          notes:         form.notes ?? null,
          expense_date:  form.expense_date,
        })
        .select()
        .single();

      if (expErr) throw expErr;

      // 2. Calculate splits
      const splits = form.split_equally
        ? calculateEqualSplits(form.amount_krw, amountMyr, form.shared_with)
        : calculateCustomSplits(
            form.amount_krw,
            amountMyr,
            form.custom_splits ?? {}
          );

      // 3. Insert splits
      const splitRows = splits.map((s) => ({
        expense_id: expense.id,
        user_id:    s.userId,
        share_krw:  s.shareKrw,
        share_myr:  s.shareMyr,
      }));

      const { error: splitErr } = await supabase
        .from("expense_splits")
        .insert(splitRows);

      if (splitErr) throw splitErr;

      return expense as Expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(tripId) });
    },
  });
}

export function useSettleSplit(tripId: string) {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (splitId: string) => {
      const { error } = await supabase
        .from("expense_splits")
        .update({ is_settled: true, settled_at: new Date().toISOString() })
        .eq("id", splitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(tripId) });
    },
  });
}
