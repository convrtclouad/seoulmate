"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExchangeRate, krwToMyr } from "@/lib/utils/currency";
import { calculateEqualSplits, calculateCustomSplits } from "@/lib/utils/expense-splitter";
import type { Expense, NewExpenseForm, ExpenseSplit } from "@/types";

const LS_KEY = "seoulmate_expenses";
const QUERY_KEY = (tripId: string) => ["expenses", tripId];

function genId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function loadAll(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch { return []; }
}

function saveAll(expenses: Expense[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(expenses));
}

export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: QUERY_KEY(tripId),
    queryFn: () => loadAll().filter((e) => e.trip_id === tripId),
    staleTime: 0,
  });
}

export function useAddExpense(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: NewExpenseForm) => {
      let rate = 1;
      let amountMyr: number | null = null;
      try {
        rate = await fetchExchangeRate();
        amountMyr = krwToMyr(form.amount_krw, rate);
      } catch { /* use defaults */ }

      const splits = form.split_equally
        ? calculateEqualSplits(form.amount_krw, amountMyr ?? 0, form.shared_with)
        : calculateCustomSplits(form.amount_krw, amountMyr ?? 0, form.custom_splits ?? {});

      const expId = genId();
      const expense: Expense = {
        id: expId,
        trip_id: tripId,
        schedule_id: null,
        title: form.title,
        category: form.category,
        amount_krw: form.amount_krw,
        amount_myr: amountMyr,
        exchange_rate: rate,
        paid_by: form.paid_by,
        receipt_url: null,
        notes: form.notes ?? null,
        expense_date: form.expense_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        splits: splits.map((s) => ({
          id: genId(),
          expense_id: expId,
          user_id: s.userId,
          share_krw: s.shareKrw,
          share_myr: s.shareMyr ?? null,
          is_settled: false,
          settled_at: null,
        } as ExpenseSplit)),
      };

      const all = loadAll();
      all.unshift(expense);
      saveAll(all);
      return expense;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(tripId) }),
  });
}

export function useSettleSplit(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (splitId: string) => {
      const all = loadAll();
      for (const exp of all) {
        if (exp.splits) {
          for (const s of exp.splits) {
            if (s.id === splitId) {
              s.is_settled = true;
              s.settled_at = new Date().toISOString();
            }
          }
        }
      }
      saveAll(all);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(tripId) }),
  });
}

export function useDeleteExpense(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      saveAll(loadAll().filter((e) => e.id !== expenseId));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(tripId) }),
  });
}
