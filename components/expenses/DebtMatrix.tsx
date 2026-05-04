"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CurrencyDisplay } from "./CurrencyDisplay";
import { buildDebtMatrix } from "@/lib/utils/expense-splitter";
import type { Expense, Profile } from "@/types";

interface DebtMatrixProps {
  expenses: Expense[];
  profiles: Profile[];
  currentUserId: string;
  onSettle?: (debtorId: string, creditorId: string) => void;
}

export function DebtMatrix({
  expenses,
  profiles,
  currentUserId,
  onSettle,
}: DebtMatrixProps) {
  const debts = buildDebtMatrix(expenses, profiles);

  if (debts.length === 0) {
    return (
      <Card className="text-center py-8">
        <div className="text-4xl mb-3">🎉</div>
        <p className="font-bold text-gray-800">All settled up!</p>
        <p className="text-sm text-gray-400 mt-1">No outstanding debts in this trip.</p>
      </Card>
    );
  }

  // Debts where I owe someone
  const iOwe    = debts.filter((d) => d.debtorId === currentUserId);
  // Debts where someone owes me
  const owedMe  = debts.filter((d) => d.creditorId === currentUserId);
  // Other debts (between friends)
  const others  = debts.filter(
    (d) => d.debtorId !== currentUserId && d.creditorId !== currentUserId
  );

  return (
    <div className="space-y-4">
      {/* I owe */}
      {iOwe.length > 0 && (
        <div>
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">
            You owe
          </p>
          <div className="space-y-2">
            {iOwe.map((debt) => (
              <Card key={`${debt.debtorId}-${debt.creditorId}`} className="flex items-center gap-3">
                <Avatar profile={debt.debtor} size="sm" />
                <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                <Avatar profile={debt.creditor} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">
                    You → {debt.creditor?.display_name}
                  </p>
                  <CurrencyDisplay
                    amountKrw={debt.amountKrw}
                    className="!text-red-500"
                  />
                </div>
                {onSettle && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onSettle(debt.debtorId, debt.creditorId)}
                  >
                    Settle
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Owed to me */}
      {owedMe.length > 0 && (
        <div>
          <p className="text-xs font-bold text-secondary-500 uppercase tracking-widest mb-2">
            Owed to you
          </p>
          <div className="space-y-2">
            {owedMe.map((debt) => (
              <Card key={`${debt.debtorId}-${debt.creditorId}`} className="flex items-center gap-3">
                <Avatar profile={debt.debtor} size="sm" />
                <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                <Avatar profile={debt.creditor} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">
                    {debt.debtor?.display_name} → You
                  </p>
                  <CurrencyDisplay
                    amountKrw={debt.amountKrw}
                    className="!text-secondary-600"
                  />
                </div>
                <CheckCircle2 className="h-5 w-5 text-secondary-300 shrink-0" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Between others */}
      {others.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Between friends
          </p>
          <div className="space-y-2">
            {others.map((debt) => (
              <Card key={`${debt.debtorId}-${debt.creditorId}`}
                    className="flex items-center gap-3 opacity-75">
                <Avatar profile={debt.debtor} size="sm" />
                <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                <Avatar profile={debt.creditor} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">
                    {debt.debtor?.display_name} → {debt.creditor?.display_name}
                  </p>
                  <CurrencyDisplay amountKrw={debt.amountKrw} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
