"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Utensils, Car, Hotel, ShoppingBag, Ticket, Heart, MoreHorizontal, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchExchangeRate, krwToMyr, formatMyr } from "@/lib/utils/currency";
import type { NewExpenseForm, ExpenseCategory } from "@/types";
import type { Member } from "@/lib/hooks/useMembers";
import { cn } from "@/lib/utils/cn";

interface ExpenseFormProps {
  members: Member[];
  currentMemberId: string;
  onSubmit: (form: NewExpenseForm) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES: { value: ExpenseCategory; label: string; icon: React.ElementType }[] = [
  { value: "food",          label: "餐饮", icon: Utensils },
  { value: "transport",     label: "交通", icon: Car },
  { value: "accommodation", label: "住宿", icon: Hotel },
  { value: "shopping",      label: "购物", icon: ShoppingBag },
  { value: "entertainment", label: "娱乐", icon: Ticket },
  { value: "health",        label: "医疗", icon: Heart },
  { value: "other",         label: "其他", icon: MoreHorizontal },
];

export function ExpenseForm({ members, currentMemberId, onSubmit, onCancel }: ExpenseFormProps) {
  const [title, setTitle]             = useState("");
  const [category, setCategory]       = useState<ExpenseCategory>("food");
  const [amountKrw, setAmountKrw]     = useState("");
  const [paidBy, setPaidBy]           = useState(currentMemberId);
  const [sharedWith, setSharedWith]   = useState<string[]>(members.map((m) => m.id));
  const [splitEqually, setSplitEqually] = useState(true);
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [myrPreview, setMyrPreview]   = useState<string | null>(null);

  // Update sharedWith when members change
  useEffect(() => {
    setSharedWith(members.map((m) => m.id));
  }, [members]);

  // Live MYR preview
  useEffect(() => {
    const krw = parseFloat(amountKrw);
    if (!krw || isNaN(krw)) { setMyrPreview(null); return; }
    fetchExchangeRate()
      .then((rate) => setMyrPreview(formatMyr(krwToMyr(krw, rate))))
      .catch(() => {});
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
      {/* Category */}
      <div>
        <label className="label">分类</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-all",
                category === value
                  ? "bg-forest text-white border-forest"
                  : "bg-white text-gray-600 border-gray-200 hover:border-forest-pale"
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
        <label className="label">消费说明</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：弘大烤肉晚餐"
          required
          className="input"
        />
      </div>

      {/* Amount */}
      <div>
        <label className="label">金额（韩元）</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₩</span>
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
          <p className="mt-1.5 text-xs text-forest-mid font-medium">≈ {myrPreview} MYR</p>
        )}
      </div>

      {/* Paid by */}
      <div>
        <label className="label">谁付钱</label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaidBy(m.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 border transition-all text-sm font-medium",
                paidBy === m.id
                  ? "bg-forest text-white border-forest"
                  : "bg-white text-gray-700 border-gray-200 hover:border-forest-pale"
              )}
            >
              <span className="text-base">{m.emoji}</span>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Split with */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">分摊成员</label>
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={splitEqually}
              onChange={(e) => setSplitEqually(e.target.checked)}
              className="rounded"
            />
            平均分摊
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const isOn = sharedWith.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 border transition-all text-sm font-medium",
                  isOn
                    ? "bg-forest text-white border-forest"
                    : "bg-white text-gray-500 border-gray-200 opacity-50"
                )}
              >
                <span className="text-base">{m.emoji}</span>
                {m.name}
              </button>
            );
          })}
        </div>
        {sharedWith.length > 0 && amountKrw && splitEqually && (
          <p className="mt-2 text-xs text-neutral-400">
            每人 ₩{Math.floor(parseFloat(amountKrw) / sharedWith.length).toLocaleString("ko-KR")}
          </p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="label">日期</label>
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
        <label className="label">备注（选填）</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="任何备注..."
          rows={2}
          className="input resize-none"
        />
      </div>

      {/* Receipt scan hint */}
      <div className="rounded-xl bg-forest-mist border border-forest-pale px-4 py-3 flex items-center gap-3">
        <Camera className="h-5 w-5 text-forest-mid shrink-0" />
        <div>
          <p className="text-xs font-semibold text-gray-700">收据扫描</p>
          <p className="text-xs text-gray-400">即将推出 — 拍照自动填写金额</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">取消</Button>
        <Button type="submit" loading={loading} className="flex-1">记录消费</Button>
      </div>
    </form>
  );
}
