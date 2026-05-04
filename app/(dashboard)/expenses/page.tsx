"use client";

import { useState } from "react";
import { Plus, BarChart3 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { DebtMatrix } from "@/components/expenses/DebtMatrix";
import { ExchangeRateBadge, CurrencyDisplay } from "@/components/expenses/CurrencyDisplay";
import { useExpenses, useAddExpense } from "@/lib/hooks/useExpenses";
import { useRealtimeExpenses } from "@/lib/hooks/useRealtimeExpenses";

// In a real app, pull tripId + members from context/server
const TRIP_ID    = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";
const MOCK_PROFILES = [
  { id: "user-1", display_name: "Bryan",   avatar_url: null, phone: null, last_lat: null, last_lng: null, last_checkin: null, created_at: "", updated_at: "" },
  { id: "user-2", display_name: "Sarah",   avatar_url: null, phone: null, last_lat: null, last_lng: null, last_checkin: null, created_at: "", updated_at: "" },
  { id: "user-3", display_name: "Mike",    avatar_url: null, phone: null, last_lat: null, last_lng: null, last_checkin: null, created_at: "", updated_at: "" },
  { id: "user-4", display_name: "Priya",   avatar_url: null, phone: null, last_lat: null, last_lng: null, last_checkin: null, created_at: "", updated_at: "" },
];
const CURRENT_USER_ID = "user-1";

type Tab = "expenses" | "debts";

export default function ExpensesPage() {
  const [tab, setTab]             = useState<Tab>("expenses");
  const [showForm, setShowForm]   = useState(false);

  const { data: expenses = [], isLoading } = useExpenses(TRIP_ID);
  const addExpense = useAddExpense(TRIP_ID);

  // Subscribe to realtime updates
  useRealtimeExpenses(TRIP_ID);

  const totalKrw = expenses.reduce((sum, e) => sum + e.amount_krw, 0);

  return (
    <div className="flex flex-col min-h-dvh">
      <Header
        title="Expenses"
        right={
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Add
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-4 pb-safe">
        {/* Summary card */}
        <Card className="bg-korean-gradient text-white" padding="lg">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
            Total Trip Spend
          </p>
          <div className="mt-1 flex items-end gap-3">
            <span className="text-3xl font-black">
              ₩{totalKrw.toLocaleString("ko-KR")}
            </span>
          </div>
          <div className="mt-2">
            <CurrencyDisplay
              amountKrw={totalKrw}
              showToggle={false}
              className="text-white/80 text-sm"
            />
          </div>
          <div className="mt-3">
            <ExchangeRateBadge />
          </div>
        </Card>

        {/* Tab switcher */}
        <div className="flex rounded-2xl bg-gray-100 p-1 gap-1">
          {(["expenses", "debts"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {t === "expenses" ? (
                <><BarChart3 className="h-4 w-4" /> Expenses</>
              ) : (
                <><BarChart3 className="h-4 w-4" /> Debts</>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-16 bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : tab === "expenses" ? (
          expenses.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-10 w-10" />}
              title="No expenses yet"
              description="Add your first expense to start tracking group spending."
              action={
                <Button onClick={() => setShowForm(true)} icon={<Plus className="h-4 w-4" />}>
                  Add Expense
                </Button>
              }
            />
          ) : (
            <ExpenseList expenses={expenses} currentUserId={CURRENT_USER_ID} />
          )
        ) : (
          <DebtMatrix
            expenses={expenses}
            profiles={MOCK_PROFILES}
            currentUserId={CURRENT_USER_ID}
          />
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Expense"
        size="full"
      >
        <ExpenseForm
          tripMembers={MOCK_PROFILES}
          currentUserId={CURRENT_USER_ID}
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
