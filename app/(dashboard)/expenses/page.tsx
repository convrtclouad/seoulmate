"use client";

import { useState, useEffect } from "react";
import { Plus, List, BarChart3, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { useExpenses, useAddExpense, useDeleteExpense, useUpdateExpense, useSettledDebts, useToggleSettledDebt } from "@/lib/hooks/useSupabaseExpenses";
import { useMembers } from "@/lib/hooks/useSupabaseMembers";
import type { Expense } from "@/types";
import { LoadingPlane } from "@/components/ui/LoadingPlane";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { DebtMatrix } from "@/components/expenses/DebtMatrix";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const CAT_EMOJI: Record<string, string> = {
  food: "🍜", transport: "🚇", shopping: "🛍️",
  accommodation: "🏨", entertainment: "🎡", health: "💊", other: "💳",
};
const CAT_BG: Record<string, string> = {
  food: "bg-petal-100", transport: "bg-ginger-100", shopping: "bg-mist-100",
  accommodation: "bg-lavender-100", entertainment: "bg-sage-100", health: "bg-petal-50", other: "bg-black/5",
};

// Hex colours for selected member pills — avoids missing Tailwind scale issues
const MEMBER_HEX = ["#5B8862", "#4A9592", "#8B7AB8", "#E8A800", "#E87060"];

type Tab = "list" | "debts";

/* ── MYR→KRW rate hook ── */
function useMyrRate() {
  const [rate, setRate]       = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchRate() {
    setLoading(true);
    try {
      // Check cache (valid for 24h)
      const cached = localStorage.getItem("seoulmate_myr_rate");
      if (cached) {
        const { rate: r, ts } = JSON.parse(cached) as { rate: number; ts: number };
        if (Date.now() - ts < 86_400_000) { setRate(r); setLoading(false); return; }
      }
      const res  = await fetch("https://open.er-api.com/v6/latest/MYR");
      const json = await res.json();
      const r    = Math.round(json.rates?.KRW ?? 310);
      localStorage.setItem("seoulmate_myr_rate", JSON.stringify({ rate: r, ts: Date.now() }));
      setRate(r);
    } catch {
      setRate(310); // fallback estimate
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { rate, loading, refresh: fetchRate };
}

export default function ExpensesPage() {
  const [tab, setTab]           = useState<Tab>("list");
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState("");

  const { data: expenses = [], isLoading } = useExpenses(TRIP_ID);
  const { data: members = [] }             = useMembers();
  const addExpense    = useAddExpense(TRIP_ID);
  const deleteExpense = useDeleteExpense(TRIP_ID);
  const updateExpense = useUpdateExpense(TRIP_ID);
  const { data: settled = new Set<string>() } = useSettledDebts();
  const toggleSettleMutation = useToggleSettledDebt();
  const { rate: myrRate, loading: rateLoading, refresh: refreshRate } = useMyrRate();

  useEffect(() => {
    setCurrentId(localStorage.getItem("seoulmate_user") ?? members[0]?.id ?? "");
  }, [members]);

  const filtered = filterMember
    ? expenses.filter((e) => e.paid_by === filterMember || e.splits?.some((s) => s.user_id === filterMember))
    : expenses;

  const totalKrw = filtered.reduce((s, e) => s + e.amount_krw, 0);

  // Personal spending: my actual share across all expenses (not what I paid on behalf of others)
  const myActualKrw = expenses.reduce((sum, exp) => {
    const inSplit = exp.splits?.some((s) => s.user_id === currentId) ?? exp.paid_by === currentId;
    if (!inSplit) return sum;
    const splitCount = exp.splits?.length || members.length || 1;
    return sum + exp.amount_krw / splitCount;
  }, 0);

  const mockProfiles = members.map((m) => ({
    id: m.id, display_name: m.name, avatar_url: null,
    phone: null, last_lat: null, last_lng: null, last_checkin: null, created_at: "", updated_at: "",
  }));

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* Header */}
      <div className="px-5 pt-safe pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-ink tracking-tight">旅游记账</h1>
            <p className="text-xs text-ink-muted mt-0.5">共同分摊，轻松结算 💰</p>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <div key={m.id} className={`h-8 w-8 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-sm ring-2 ring-cream`}>
                {m.emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MYR→KRW rate banner */}
      <div className="mx-4 mb-2 rounded-2xl bg-surface px-4 py-2.5 flex items-center justify-between"
           style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2">
          <span className="text-base">🇲🇾</span>
          <div>
            <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-wider">实时汇率</p>
            {rateLoading ? (
              <p className="text-xs text-ink-muted">载入中…</p>
            ) : (
              <p className="text-sm font-black text-ink">
                1 MYR = <span className="text-petal-400">₩{myrRate?.toLocaleString("ko-KR")}</span>
              </p>
            )}
          </div>
        </div>
        <button onClick={refreshRate}
          className="p-2 rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
          disabled={rateLoading}>
          <RefreshCw className={`h-3.5 w-3.5 text-ink-muted ${rateLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Personal vs Group spending dashboard ── */}
      <div className="mx-4 mb-3 grid grid-cols-2 gap-2">
        {/* Group total */}
        <div className="rounded-3xl px-4 py-4 relative overflow-hidden"
             style={{ background: "linear-gradient(135deg, #E87060, #F4A590)", boxShadow: "0 8px 24px rgba(232,112,96,0.25)" }}>
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
          <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">团队总支出</p>
          <p className="text-2xl font-black text-white mt-1 leading-none tracking-tight">
            ₩{expenses.reduce((s,e) => s+e.amount_krw, 0).toLocaleString("ko-KR")}
          </p>
          {myrRate && expenses.length > 0 && (
            <p className="text-white/60 text-[10px] mt-1">
              ≈ RM {(expenses.reduce((s,e)=>s+e.amount_krw,0) / myrRate).toFixed(0)}
            </p>
          )}
          <p className="text-white/50 text-[10px] mt-0.5">{expenses.length} 笔消费</p>
        </div>

        {/* My actual share */}
        <div className="rounded-3xl px-4 py-4 relative overflow-hidden"
             style={{ background: "linear-gradient(135deg, #5B8862, #4A9592)", boxShadow: "0 8px 24px rgba(91,136,98,0.25)" }}>
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
          <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">我的实际花费</p>
          <p className="text-2xl font-black text-white mt-1 leading-none tracking-tight">
            ₩{Math.round(myActualKrw).toLocaleString("ko-KR")}
          </p>
          {myrRate && myActualKrw > 0 && (
            <p className="text-white/60 text-[10px] mt-1">
              ≈ RM {(myActualKrw / myrRate).toFixed(0)}
            </p>
          )}
          <p className="text-white/50 text-[10px] mt-0.5">我的分摊金额</p>
        </div>
      </div>

      {/* Member filter */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setFilterMember(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              !filterMember ? "bg-ink text-cream" : "bg-surface text-ink-muted"
            }`} style={{ boxShadow: "var(--shadow-card)" }}>
            全部
          </button>
          {members.map((m, idx) => {
            const isSelected = filterMember === m.id;
            const hex = MEMBER_HEX[idx % MEMBER_HEX.length];
            return (
              <button key={m.id}
                onClick={() => setFilterMember(isSelected ? null : m.id)}
                className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                style={{
                  background: isSelected ? hex : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : "#5C5A58",
                  boxShadow: isSelected ? `0 3px 14px ${hex}55` : "var(--shadow-card)",
                }}>
                <span>{m.emoji}</span>
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab */}
      <div className="px-4 mb-3">
        <div className="tab-bar">
          <button onClick={() => setTab("list")} className={tab === "list" ? "tab-item-active" : "tab-item-inactive"}>
            <List className="h-4 w-4" /> <span className="text-xs font-bold">明细</span>
          </button>
          <button onClick={() => setTab("debts")} className={tab === "debts" ? "tab-item-active" : "tab-item-inactive"}>
            <BarChart3 className="h-4 w-4" /> <span className="text-xs font-bold">分摊</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-safe">
        {isLoading ? (
          <LoadingPlane text="载入支出中…" />
        ) : tab === "list" ? (
          filtered.length === 0 ? (
            <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="text-4xl mb-3">💳</div>
              <p className="font-bold text-ink text-sm">还没有支出记录</p>
              <p className="text-xs text-ink-muted mt-1">出发后记录每笔消费</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((exp) => {
                const payer = members.find(m => m.id === exp.paid_by);
                const myrEquiv = myrRate ? (exp.amount_krw / myrRate).toFixed(2) : null;
                const isConfirmingDelete = confirmDeleteId === exp.id;
                return (
                  <div key={exp.id} className="rounded-3xl bg-surface p-4"
                       style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-2xl ${CAT_BG[exp.category ?? "other"] ?? "bg-black/5"} flex items-center justify-center text-xl shrink-0`}>
                        {CAT_EMOJI[exp.category ?? "other"] ?? "💳"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-ink text-sm truncate">{exp.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {payer && <span className="text-base">{payer.emoji}</span>}
                          <span className="text-xs text-ink-muted">{payer?.name ?? exp.paid_by} 付款</span>
                          <span className="text-ink-faint text-xs">· {exp.expense_date}</span>
                        </div>
                        {myrEquiv && (
                          <p className="text-[10px] text-ink-faint mt-0.5">≈ RM {myrEquiv}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="font-black text-ink text-sm whitespace-nowrap">
                          ₩{exp.amount_krw.toLocaleString("ko-KR")}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingExpense(exp); }}
                            className="h-7 w-7 rounded-xl bg-lavender-100 flex items-center justify-center">
                            <Pencil className="h-3.5 w-3.5 text-lavender" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(exp.id)}
                            className="h-7 w-7 rounded-xl bg-black/5 flex items-center justify-center">
                            <Trash2 className="h-3.5 w-3.5 text-ink-faint" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {isConfirmingDelete && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-black/5">
                        <button
                          onClick={() => { deleteExpense.mutate(exp.id); setConfirmDeleteId(null); }}
                          className="flex-1 text-xs font-bold bg-petal-100 text-petal-400 rounded-xl py-1.5">
                          确认删除
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 text-xs font-bold bg-black/5 text-ink-muted rounded-xl py-1.5">
                          取消
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <DebtMatrix expenses={expenses} profiles={mockProfiles} currentUserId={currentId}
            settled={settled} onToggleSettle={(debtorId, creditorId) => toggleSettleMutation.mutate({ debtorId, creditorId, currentlySettled: settled.has(`${debtorId}→${creditorId}`) })} />
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowForm(true)}
        className="fixed bottom-32 right-5 h-14 w-14 rounded-full text-white flex items-center justify-center z-30"
        style={{ background: "linear-gradient(135deg, #E87060, #EE9080)", boxShadow: "0 6px 24px rgba(232,112,96,0.35)" }}>
        <Plus className="h-6 w-6" />
      </button>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="新增消费" size="full">
        <ExpenseForm
          members={members}
          currentMemberId={currentId}
          onSubmit={async (form) => { await addExpense.mutateAsync(form); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editingExpense} onClose={() => setEditingExpense(null)} title="编辑消费" size="full">
        {editingExpense && (
          <ExpenseForm
            members={members}
            currentMemberId={currentId}
            initialValues={editingExpense}
            onSubmit={async () => {}}
            onUpdate={async (form) => {
              await updateExpense.mutateAsync({ id: editingExpense.id, form });
              setEditingExpense(null);
            }}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>
    </div>
  );
}
