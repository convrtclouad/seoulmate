"use client";

import { format, parseISO } from "date-fns";
import {
  Utensils, Car, Hotel, ShoppingBag,
  Ticket, Heart, MoreHorizontal, CheckCircle2,
} from "lucide-react";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { CurrencyDisplay } from "./CurrencyDisplay";
import type { Expense, ExpenseCategory } from "@/types";
import { cn } from "@/lib/utils/cn";

const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { icon: React.ElementType; color: string; bg: string }
> = {
  food:          { icon: Utensils,     color: "text-orange-500", bg: "bg-orange-50" },
  transport:     { icon: Car,          color: "text-blue-500",   bg: "bg-blue-50" },
  accommodation: { icon: Hotel,        color: "text-purple-500", bg: "bg-purple-50" },
  shopping:      { icon: ShoppingBag,  color: "text-pink-500",   bg: "bg-pink-50" },
  entertainment: { icon: Ticket,       color: "text-yellow-500", bg: "bg-yellow-50" },
  health:        { icon: Heart,        color: "text-red-500",    bg: "bg-red-50" },
  other:         { icon: MoreHorizontal, color: "text-gray-500", bg: "bg-gray-50" },
};

interface ExpenseListProps {
  expenses: Expense[];
  currentUserId: string;
}

export function ExpenseList({ expenses, currentUserId }: ExpenseListProps) {
  // Group by date
  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, exp) => {
    const key = exp.expense_date;
    (acc[key] ??= []).push(exp);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            {format(parseISO(date), "EEE, d MMM")}
          </p>
          <div className="space-y-3">
            {grouped[date].map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpenseCard({
  expense,
  currentUserId,
}: {
  expense: Expense;
  currentUserId: string;
}) {
  const config = CATEGORY_CONFIG[expense.category];
  const Icon   = config.icon;

  const mySplit = expense.splits?.find((s) => s.user_id === currentUserId);
  const iMyPaid = expense.paid_by === currentUserId;
  const participants = expense.splits?.map((s) => s.profile).filter(Boolean) ?? [];

  return (
    <div className="card flex items-center gap-3">
      {/* Category icon */}
      <div className={cn("rounded-xl p-2.5 shrink-0", config.bg)}>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{expense.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Avatar profile={expense.paid_by_profile} size="xs" />
          <span className="text-xs text-gray-400">
            {iMyPaid ? "You paid" : `${expense.paid_by_profile?.display_name ?? "Someone"} paid`}
          </span>
        </div>
        {participants.length > 0 && (
          <div className="mt-1.5">
            <AvatarGroup profiles={participants} max={5} />
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <CurrencyDisplay amountKrw={expense.amount_krw} showToggle={false} />

        {/* My share badge */}
        {mySplit && (
          <div className={cn(
            "mt-1 flex items-center justify-end gap-1",
            mySplit.is_settled ? "text-forest" : iMyPaid ? "text-forest-mid" : "text-red-500"
          )}>
            {mySplit.is_settled && <CheckCircle2 className="h-3 w-3" />}
            <span className="text-xs font-medium">
              {iMyPaid
                ? "+₩" + expense.amount_krw.toLocaleString()
                : "−₩" + mySplit.share_krw.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
