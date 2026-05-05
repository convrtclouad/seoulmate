"use client";

import { useState, useEffect } from "react";
import { Plus, List, BarChart3 } from "lucide-react";
import { useExpenses, useAddExpense } from "@/lib/hooks/useExpenses";
import { useMembers } from "@/lib/hooks/useMembers";
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

type Tab = "list" | "debts";

export default function ExpensesPage() {
  const [tab, setTab]           = useState<Tab>("list");
  const [showForm, setShowForm] = useState(false);
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState("");

  const { data: expenses = [], isLoading } = useExpenses(TRIP_ID);
  const { data: members = [] }             = useMembers();
  const addExpense = useAddExpense(TRIP_ID);

  useEffect(() => {
    setCurrentId(localStorage.getItem("seoulmate_user") ?? members[0]?.id ?? "");
  }, [members]);

  const filtered = filterMember
    ? expenses.filter((e) => e.paid_by === filterMember || e.splits?.some((s) => s.user_id === filterMember))
    : expenses;

  const totalKrw = filtered.reduce((s, e) => s + e.amount_krw, 0);

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

      {/* Total card */}
      <div className="mx-4 mb-3 rounded-3xl px-5 py-4 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #E87060, #F4B5A5)", boxShadow: "0 8px 28px rgba(232,112,96,0.25)" }}>
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <p className="text-white/70 text-xs font-semibold uppercase tracking-airy">旅游总支出</p>
        <p className="text-4xl font-black text-white mt-1 tracking-tight">
          ₩{totalKrw.toLocaleString("ko-KR")}
        </p>
        <p className="text-white/60 text-xs mt-1">{filtered.length} 笔消费</p>
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
          {members.map((m) => (
            <button key={m.id} onClick={() => setFilterMember(filterMember === m.id ? null : m.id)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                filterMember === m.id ? `bg-gradient-to-r ${m.color} text-white` : "bg-surface text-ink-muted"
              }`} style={{ boxShadow: "var(--shadow-card)" }}>
              <span>{m.emoji}</span>{m.name}
            </button>
          ))}
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
                return (
                  <div key={exp.id} className="rounded-3xl bg-surface p-4 flex items-center gap-3"
                       style={{ boxShadow: "var(--shadow-card)" }}>
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
                    </div>
                    <span className="font-black text-ink text-sm whitespace-nowrap">
                      ₩{exp.amount_krw.toLocaleString("ko-KR")}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <DebtMatrix expenses={expenses} profiles={mockProfiles} currentUserId={currentId} />
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-5 h-14 w-14 rounded-full text-white flex items-center justify-center z-30"
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
    </div>
  );
}
