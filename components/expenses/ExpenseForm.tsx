"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Utensils, Car, Hotel, ShoppingBag,
  Ticket, Heart, MoreHorizontal, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { fetchExchangeRate, krwToMyr, formatMyr } from "@/lib/utils/currency";
import type { Profile, NewExpenseForm, ExpenseCategory } from "@/types";
import { cn } from "@/lib/utils/cn";

interface ExpenseFormProps {
  tripMembers: Profile[];
  currentUserId: string;
  onSubmit: (form: NewExpenseForm) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES: { value: ExpenseCategory; label: string; icon: React.ElementType }[] = [
  { value: "food",          label: "Food",      icon: Utensils },
  { value: "transport",     label: "Transport", icon: Car },
  { value: "accommodation", label: "Stay",      icon: Hotel },
  { value: "shopping",      label: "Shopping",  icon: ShoppingBag },
  { value: "entertainment", label: "Fun",       icon: Ticket },
  { value: "health",        label: "Health",    icon: Heart },
  { value: "other",         label: "Other",     icon: MoreHorizontal },
];

export function ExpenseForm({
  tripMembers,
  currentUserId,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [title, setTitle]             = useState("");
  const [category, setCategory]       = useState<ExpenseCategory>("food");
  const [amountKrw, setAmountKrw]     = useState("");
  const [paidBy, setPaidBy]           = useState(currentUserId);
  const [sharedWith, setSharedWith]   = useState<string[]>(
    tripMembers.map((m) => m.id)        // default: split with everyone
  );
  const [splitEqually, setSplitEqually] = useState(true);
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [myrPreview, setMyrPreview]   = useState<string | null>(null);

  // Live MYR preview
  useEffect(() => {
    const krw = parseFloat(amountKrw);
    if (!krw || isNaN(krw)) { setMyrPreview(null); return; }
    fetchExchangeRate().then((rate) => {
      setMyrPreview(formatMyr(krwToMyr(krw, rate)));
    });
  }, [amountKrw]);

  function toggleMember(id: string) {
    setSharedWith((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amountKrw || sharedWith.length === 0) return;
    setLoading(true);
    try {
      await onSubmit({
        title,
        category,
        amount_krw: parseFloat(amountKrw),
        paid_by: paidBy,
        shared_with: sharedWith,
        split_equally: splitEqually,
        notes: notes || undefined,
        expense_date: expenseDate,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Category picker */}
      <div>
        <label className="label">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-all",
                category === value
                  ? "bg-primary-500 text-white border-primary-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="label">Description</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Samgyeopsal dinner at Hongdae"
          required
          className="input"
        />
      </div>

      {/* Amount */}
      <div>
        <label className="label">Amount (KRW)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
            ₩
          </span>
          <input
            type="number"
            value={amountKrw}
            onChange={(e) => setAmountKrw(e.target.value)}
            placeholder="0"
            min="1"
            required
            className="input pl-7 font-mono text-base"
          />
        </div>
        {myrPreview && (
          <p className="mt-1.5 text-xs text-forest-mid font-medium">
            ≈ {myrPreview} MYR
          </p>
        )}
      </div>

      {/* Paid by */}
      <div>
        <label className="label">Paid by</label>
        <div className="flex flex-wrap gap-2">
          {tripMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setPaidBy(member.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 border transition-all text-sm font-medium",
                paidBy === member.id
                  ? "bg-primary-500 text-white border-primary-500"
                  : "bg-white text-gray-700 border-gray-200"
              )}
            >
              <Avatar profile={member} size="xs" />
              {member.display_name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Split with */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Split with</label>
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={splitEqually}
              onChange={(e) => setSplitEqually(e.target.checked)}
              className="rounded"
            />
            Split equally
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {tripMembers.map((member) => {
            const selected = sharedWith.includes(member.id);
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggleMember(member.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 border transition-all text-sm font-medium",
                  selected
                    ? "bg-forest text-white border-forest"
                    : "bg-white text-gray-500 border-gray-200 opacity-60"
                )}
              >
                <Avatar profile={member} size="xs" />
                {member.display_name.split(" ")[0]}
              </button>
            );
          })}
        </div>
        {sharedWith.length > 0 && amountKrw && splitEqually && (
          <p className="mt-2 text-xs text-gray-400">
            ₩{Math.floor(parseFloat(amountKrw) / sharedWith.length).toLocaleString()} each
          </p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="label">Date</label>
        <input
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          required
          className="input"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes?"
          rows={2}
          className="input resize-none"
        />
      </div>

      {/* OCR hint */}
      <div className="rounded-xl bg-forest-mist border border-forest-pale px-4 py-3 flex items-center gap-3">
        <Camera className="h-5 w-5 text-forest-mid shrink-0" />
        <div>
          <p className="text-xs font-semibold text-gray-700">Receipt Scan</p>
          <p className="text-xs text-gray-400">Coming soon — auto-fill from photo</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Add Expense
        </Button>
      </div>
    </form>
  );
}
