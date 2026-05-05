"use client";

import { useState, useEffect } from "react";
import { Plus, BarChart3, List } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingPlane } from "@/components/ui/LoadingPlane";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { DebtMatrix } from "@/components/expenses/DebtMatrix";
import { ExchangeRateBadge, CurrencyDisplay } from "@/components/expenses/CurrencyDisplay";
import { useExpenses, useAddExpense } from "@/lib/hooks/useExpenses";
import { useMembers } from "@/lib/hooks/useMembers";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";

type Tab = "expenses" | "debts";

export default function ExpensesPage() {
  const [tab, setTab]           = useState<Tab>("expenses");
  const [showForm, setShowForm] = useState(false);
  const [currentId, setCurrentId] = useState("bryan");

  const { data: expenses = [], isLoading } = useExpenses(TRIP_ID);
  const { data: members = [] }             = useMembers();
  const addExpense = useAddExpense(TRIP_ID);

  useEffect(() => {
    setCurrentId(localStorage.getItem("seoulmate_user") ?? members[0]?.id ?? "");
  }, [members]);

  const totalKrw = expenses.reduce((s, e) => s + e.amount_krw, 0);

  // Convert members to Profile-compatible shape for existing components
  const mockProfiles = members.map((m) => ({
    id: m.id,
    display_name: m.name,
    avatar_url: null,
    phone: null,
    last_lat: null,
    last_lng: null,
    last_checkin: null,
    created_at: "",
    updated_at: "",
  }));

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      <Header
        title="记账"
        right={
          <Button size="sm" onClick={() => setShowForm(true)} icon={<Plus className="h-4 w-4" />}>
            新增
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-4 pb-safe">
        {/* Summary card */}
        <div className="rounded-3xl bg-forest px-5 py-4 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-forest-light/50" />
          <div className="relative z-10">
            <p className="text-forest-pale text-xs font-semibold uppercase tracking-widest">旅游总支出</p>
            <div className="mt-1 flex items-end gap-3">
              <span className="text-3xl font-black text-white">₩{totalKrw.toLocaleString("ko-KR")}</span>
            </div>
            <div className="mt-2">
              <CurrencyDisplay amountKrw={totalKrw} showToggle={false} className="text-forest-pale text-sm" />
            </div>
            <div className="mt-3">
              <ExchangeRateBadge />
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl bg-neutral-100 p-1 gap-1">
          {([["expenses","支出明细",List], ["debts","分摊欠款",BarChart3]] as const).map(([t, label, Icon]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-neutral-500"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingPlane text="载入支出中..." />
        ) : tab === "expenses" ? (
          expenses.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-10 w-10" />}
              title="还没有支出记录"
              description="记录你们的第一笔消费开始追踪"
              action={
                <Button onClick={() => setShowForm(true)} icon={<Plus className="h-4 w-4" />}>
                  新增消费
                </Button>
              }
            />
          ) : (
            <ExpenseList expenses={expenses} currentUserId={currentId} />
          )
        ) : (
          <DebtMatrix expenses={expenses} profiles={mockProfiles} currentUserId={currentId} />
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="新增消费" size="full">
        <ExpenseForm
          members={members}
          currentMemberId={currentId}
          onSubmit={async (form) => {
            await addExpense.mutateAsync(form);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
