"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { buildDebtMatrix } from "@/lib/utils/expense-splitter";
import type { Expense, Profile } from "@/types";

interface DebtMatrixProps {
  expenses: Expense[];
  profiles: Profile[];
  currentUserId: string;
  onSettle?: (debtorId: string, creditorId: string) => void;
}

function Bubble({ name }: { name: string }) {
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center text-sm font-bold text-sage-600 shrink-0">
      {name.charAt(0)}
    </div>
  );
}

export function DebtMatrix({ expenses, profiles, currentUserId, onSettle }: DebtMatrixProps) {
  const debts = buildDebtMatrix(expenses, profiles);

  if (debts.length === 0) {
    return (
      <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="text-4xl mb-3">🎉</div>
        <p className="font-bold text-ink text-sm">大家都结清啦！</p>
        <p className="text-xs text-ink-muted mt-1">目前没有未结算的欠款</p>
      </div>
    );
  }

  const iOwe   = debts.filter((d) => d.debtorId === currentUserId);
  const owedMe = debts.filter((d) => d.creditorId === currentUserId);
  const others = debts.filter(
    (d) => d.debtorId !== currentUserId && d.creditorId !== currentUserId
  );

  const getName = (p?: Profile | null) => p?.display_name ?? "?";

  return (
    <div className="space-y-4">
      {/* 我需要还款 */}
      {iOwe.length > 0 && (
        <div>
          <p className="text-xs font-bold text-petal-400 uppercase tracking-wider mb-2">💸 我需要还款</p>
          <div className="space-y-2">
            {iOwe.map((debt) => (
              <div key={`${debt.debtorId}-${debt.creditorId}`}
                   className="rounded-3xl bg-surface p-4 flex items-center gap-3"
                   style={{ boxShadow: "var(--shadow-card)" }}>
                <Bubble name="我" />
                <ArrowRight className="h-4 w-4 text-ink-faint shrink-0" />
                <Bubble name={getName(debt.creditor)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-muted">我 → {getName(debt.creditor)}</p>
                  <p className="font-black text-petal-400 text-base">
                    ₩{debt.amountKrw.toLocaleString("ko-KR")}
                  </p>
                </div>
                {onSettle && (
                  <button onClick={() => onSettle(debt.debtorId, debt.creditorId)}
                    className="text-xs font-bold bg-petal-100 text-petal-400 rounded-2xl px-3 py-1.5">
                    结清
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 别人欠我 */}
      {owedMe.length > 0 && (
        <div>
          <p className="text-xs font-bold text-sage-600 uppercase tracking-wider mb-2">✅ 别人欠我</p>
          <div className="space-y-2">
            {owedMe.map((debt) => (
              <div key={`${debt.debtorId}-${debt.creditorId}`}
                   className="rounded-3xl bg-surface p-4 flex items-center gap-3"
                   style={{ boxShadow: "var(--shadow-card)" }}>
                <Bubble name={getName(debt.debtor)} />
                <ArrowRight className="h-4 w-4 text-ink-faint shrink-0" />
                <Bubble name="我" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-muted">{getName(debt.debtor)} → 我</p>
                  <p className="font-black text-sage-600 text-base">
                    ₩{debt.amountKrw.toLocaleString("ko-KR")}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-sage-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 成员之间 */}
      {others.length > 0 && (
        <div>
          <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">👥 成员之间</p>
          <div className="space-y-2">
            {others.map((debt) => (
              <div key={`${debt.debtorId}-${debt.creditorId}`}
                   className="rounded-3xl bg-surface p-4 flex items-center gap-3 opacity-70"
                   style={{ boxShadow: "var(--shadow-card)" }}>
                <Bubble name={getName(debt.debtor)} />
                <ArrowRight className="h-4 w-4 text-ink-faint shrink-0" />
                <Bubble name={getName(debt.creditor)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-muted">
                    {getName(debt.debtor)} → {getName(debt.creditor)}
                  </p>
                  <p className="font-black text-ink text-base">
                    ₩{debt.amountKrw.toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
