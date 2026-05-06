"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { getSupabaseClient, hasSupabase } from "@/lib/supabase/client";
import { fetchExchangeRate, krwToMyr } from "@/lib/utils/currency";
import { calculateEqualSplits, calculateCustomSplits } from "@/lib/utils/expense-splitter";
import type { Expense, NewExpenseForm, ExpenseSplit } from "@/types";

const TRIP_ID   = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const QUERY_KEY = ["sb_expenses", TRIP_ID];

function genId() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id:            row.id as string,
    trip_id:       row.trip_id as string,
    schedule_id:   null,
    title:         row.title as string,
    category:      row.category as Expense["category"],
    amount_krw:    Number(row.amount_krw),
    amount_myr:    row.amount_myr ? Number(row.amount_myr) : null,
    exchange_rate: row.exchange_rate ? Number(row.exchange_rate) : null,
    paid_by:       row.paid_by as string,
    receipt_url:   null,
    notes:         (row.notes as string | null) ?? null,
    expense_date:  row.expense_date as string,
    created_at:    row.created_at as string,
    updated_at:    row.created_at as string,
    splits:        (row.splits as ExpenseSplit[]) ?? [],
  };
}

export function useExpenses(_tripId?: string) {
  const qc = useQueryClient();
  const sb = getSupabaseClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      if (!hasSupabase()) { try { return JSON.parse(localStorage.getItem("seoulmate_expenses") ?? "[]") as Expense[]; } catch { return []; } }
      const { data, error } = await sb
        .from("trip_expenses")
        .select("*")
        .eq("trip_id", TRIP_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToExpense);
    },
    staleTime: Infinity,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  }, [qc]);

  useEffect(() => {
    const ch = sb
      .channel(`expenses_${TRIP_ID}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "trip_expenses",
        filter: `trip_id=eq.${TRIP_ID}`,
      }, refresh)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, refresh]);

  return query;
}

export function useAddExpense(_tripId?: string) {
  const qc = useQueryClient();
  const sb = getSupabaseClient();

  return useMutation({
    mutationFn: async (form: NewExpenseForm) => {
      if (!hasSupabase()) { let rate = 1; let amountMyr: number | null = null; try { rate = await fetchExchangeRate(); amountMyr = krwToMyr(form.amount_krw, rate); } catch {} const splits = form.split_equally ? calculateEqualSplits(form.amount_krw, amountMyr ?? 0, form.shared_with) : calculateCustomSplits(form.amount_krw, amountMyr ?? 0, form.custom_splits ?? {}); const expId = genId(); const expense = { id: expId, trip_id: TRIP_ID, schedule_id: null, title: form.title, category: form.category, amount_krw: form.amount_krw, amount_myr: amountMyr, exchange_rate: rate, paid_by: form.paid_by, receipt_url: null, notes: form.notes ?? null, expense_date: form.expense_date, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), splits: splits.map((s) => ({ id: genId(), expense_id: expId, user_id: s.userId, share_krw: s.shareKrw, share_myr: s.shareMyr ?? null, is_settled: false, settled_at: null })) }; const all = JSON.parse(localStorage.getItem("seoulmate_expenses") ?? "[]"); all.unshift(expense); localStorage.setItem("seoulmate_expenses", JSON.stringify(all)); return expense; }
      let rate = 1; let amountMyr: number | null = null;
      try { rate = await fetchExchangeRate(); amountMyr = krwToMyr(form.amount_krw, rate); } catch {}

      const splits = form.split_equally
        ? calculateEqualSplits(form.amount_krw, amountMyr ?? 0, form.shared_with)
        : calculateCustomSplits(form.amount_krw, amountMyr ?? 0, form.custom_splits ?? {});

      const expId = genId();
      const splitRows: ExpenseSplit[] = splits.map((s) => ({
        id: genId(), expense_id: expId, user_id: s.userId,
        share_krw: s.shareKrw, share_myr: s.shareMyr ?? null,
        is_settled: false, settled_at: null,
      }));

      const row = {
        id: expId, trip_id: TRIP_ID,
        title: form.title, category: form.category,
        amount_krw: form.amount_krw, amount_myr: amountMyr,
        exchange_rate: rate, paid_by: form.paid_by,
        expense_date: form.expense_date, notes: form.notes ?? null,
        splits: splitRows,
      };
      const { error } = await sb.from("trip_expenses").insert(row);
      if (error) throw error;
      return row;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteExpense(_tripId?: string) {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!hasSupabase()) { const all = JSON.parse(localStorage.getItem("seoulmate_expenses") ?? "[]").filter((e: Expense) => e.id !== id); localStorage.setItem("seoulmate_expenses", JSON.stringify(all)); return; }
      const { error } = await sb.from("trip_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

/* ── Settled debts (Supabase-backed) ── */
const SETTLED_KEY = ["settled_debts", TRIP_ID];

export function useSettledDebts() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();

  const query = useQuery({
    queryKey: SETTLED_KEY,
    queryFn: async () => {
      if (!hasSupabase()) { try { return new Set<string>(JSON.parse(localStorage.getItem("seoulmate_settled_debts") ?? "[]") as string[]); } catch { return new Set<string>(); } }
      const { data, error } = await sb
        .from("settled_debts")
        .select("debtor_id, creditor_id")
        .eq("trip_id", TRIP_ID);
      if (error) throw error;
      return new Set((data ?? []).map((r: { debtor_id: string; creditor_id: string }) => `${r.debtor_id}→${r.creditor_id}`));
    },
    staleTime: Infinity,
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: SETTLED_KEY });
  }, [qc]);

  useEffect(() => {
    const ch = sb
      .channel(`settled_${TRIP_ID}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "settled_debts",
        filter: `trip_id=eq.${TRIP_ID}`,
      }, refresh)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, refresh]);

  return query;
}

export function useToggleSettledDebt() {
  const qc = useQueryClient();
  const sb = getSupabaseClient();
  return useMutation({
    mutationFn: async ({ debtorId, creditorId, currentlySettled }: {
      debtorId: string; creditorId: string; currentlySettled: boolean;
    }) => {
      if (!hasSupabase()) { const key = `${debtorId}→${creditorId}`; const all = new Set(JSON.parse(localStorage.getItem("seoulmate_settled_debts") ?? "[]")); if (currentlySettled) all.delete(key); else all.add(key); localStorage.setItem("seoulmate_settled_debts", JSON.stringify([...all])); return; }
      if (currentlySettled) {
        await sb.from("settled_debts")
          .delete()
          .eq("trip_id", TRIP_ID)
          .eq("debtor_id", debtorId)
          .eq("creditor_id", creditorId);
      } else {
        await sb.from("settled_debts")
          .upsert({ trip_id: TRIP_ID, debtor_id: debtorId, creditor_id: creditorId },
                  { onConflict: "trip_id,debtor_id,creditor_id" });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTLED_KEY }),
  });
}
