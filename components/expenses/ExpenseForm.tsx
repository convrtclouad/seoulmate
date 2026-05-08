"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Utensils, Car, Hotel, ShoppingBag, Ticket, Heart, MoreHorizontal, ImagePlus, X } from "lucide-react";
import { fetchExchangeRate, krwToMyr, formatMyr } from "@/lib/utils/currency";
import { tap } from "@/lib/utils/haptics";
import type { NewExpenseForm, ExpenseCategory, Expense } from "@/types";
import type { Member } from "@/lib/hooks/useMembers";

interface ExpenseFormProps {
  members: Member[];
  currentMemberId: string;
  onSubmit: (form: NewExpenseForm) => Promise<void>;
  onCancel: () => void;
  initialValues?: Partial<Expense>;
  onUpdate?: (form: NewExpenseForm) => Promise<void>;
}

const CATEGORIES: { value: ExpenseCategory; label: string; icon: React.ElementType; bg: string; text: string }[] = [
  { value: "food",          label: "餐饮", icon: Utensils,     bg: "bg-petal-100",   text: "text-petal-400" },
  { value: "transport",     label: "交通", icon: Car,          bg: "bg-ginger-100",  text: "text-ginger-500" },
  { value: "accommodation", label: "住宿", icon: Hotel,        bg: "bg-lavender-100",text: "text-lavender-400" },
  { value: "shopping",      label: "购物", icon: ShoppingBag,  bg: "bg-mist-100",    text: "text-mist-400" },
  { value: "entertainment", label: "娱乐", icon: Ticket,       bg: "bg-sage-100",    text: "text-sage-600" },
  { value: "health",        label: "医疗", icon: Heart,        bg: "bg-petal-50",    text: "text-petal-300" },
  { value: "other",         label: "其他", icon: MoreHorizontal,bg: "bg-black/5",    text: "text-ink-muted" },
];

// Fixed solid colours for "who paid" + "split with" selected state — one per member slot
const PAID_COLORS = [
  { bg: "bg-sage",       text: "text-white" },
  { bg: "bg-lavender",   text: "text-white" },
  { bg: "bg-ginger-500", text: "text-white" },
  { bg: "bg-petal-400",  text: "text-white" },
  { bg: "bg-mist-500",   text: "text-white" },
];

export function ExpenseForm({ members, currentMemberId, onSubmit, onCancel, initialValues, onUpdate }: ExpenseFormProps) {
  const isEditMode = !!onUpdate;
  const [title, setTitle]               = useState(initialValues?.title ?? "");
  const [category, setCategory]         = useState<ExpenseCategory>(initialValues?.category ?? "food");
  const [amountKrw, setAmountKrw]       = useState(initialValues?.amount_krw ? String(initialValues.amount_krw) : "");
  const [paidBy, setPaidBy]             = useState(initialValues?.paid_by ?? currentMemberId);
  const [sharedWith, setSharedWith]     = useState<string[]>(
    initialValues?.splits?.map((s) => s.user_id) ?? members.map((m) => m.id)
  );
  const [splitEqually, setSplitEqually] = useState(true);
  const [expenseDate, setExpenseDate]   = useState(initialValues?.expense_date ?? format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes]               = useState(initialValues?.notes ?? "");
  const [loading, setLoading]           = useState(false);
  const [myrPreview, setMyrPreview]     = useState<string | null>(null);
  const [photo, setPhoto]               = useState<string | null>(null); // base64
  const fileRef                         = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialValues?.splits) {
      setSharedWith(members.map((m) => m.id));
    }
  }, [members]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const krw = parseFloat(amountKrw);
    if (!krw || isNaN(krw)) { setMyrPreview(null); return; }
    fetchExchangeRate()
      .then((rate) => setMyrPreview(formatMyr(krwToMyr(krw, rate))))
      .catch(() => {});
  }, [amountKrw]);

  function toggleMember(id: string) {
    tap();
    setSharedWith((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amountKrw || sharedWith.length === 0) return;
    setLoading(true);
    const formData: NewExpenseForm = {
      title,
      category,
      amount_krw: parseFloat(amountKrw),
      paid_by: paidBy,
      shared_with: sharedWith,
      split_equally: splitEqually,
      notes: notes || undefined,
      expense_date: expenseDate,
    };
    try {
      if (isEditMode && onUpdate) {
        await onUpdate(formData);
      } else {
        await onSubmit(formData);
      }
    } finally {
      setLoading(false);
    }
  }

  const catInfo = CATEGORIES.find((c) => c.value === category)!;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Category */}
      <div>
        <label className="label">分类</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ value, label, icon: Icon, bg, text }) => {
            const isActive = category === value;
            return (
              <button key={value} type="button"
                onClick={() => { tap(); setCategory(value); }}
                className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold transition-all ${
                  isActive ? `${bg} ${text} ring-2 ring-offset-1 ring-current/40` : "bg-surface text-ink-muted"
                }`}
                style={{ boxShadow: "var(--shadow-card)" }}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="label">消费说明</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="例：弘大烤肉晚餐" required className="input" />
      </div>

      {/* Amount */}
      <div>
        <label className="label">金额（韩元）</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted">₩</span>
          <input type="number" value={amountKrw} onChange={(e) => setAmountKrw(e.target.value)}
            placeholder="0" min="1" required className="input pl-8 font-mono text-base" />
        </div>
        {myrPreview && (
          <p className="mt-1.5 text-xs text-sage-600 font-semibold">≈ RM {myrPreview}</p>
        )}
      </div>

      {/* Paid by */}
      <div>
        <label className="label">谁付钱</label>
        <div className="flex flex-wrap gap-2">
          {members.map((m, idx) => {
            const isActive = paidBy === m.id;
            const col = PAID_COLORS[idx % PAID_COLORS.length];
            return (
              <button key={m.id} type="button"
                onClick={() => { tap(); setPaidBy(m.id); }}
                className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold transition-all ${
                  isActive ? `${col.bg} ${col.text}` : "bg-surface text-ink-mid"
                }`}
                style={{ boxShadow: isActive ? "0 3px 12px rgba(0,0,0,0.18)" : "var(--shadow-card)" }}>
                <span className="text-base">{m.emoji}</span>
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Split with */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">分摊成员</label>
          <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer select-none">
            <input type="checkbox" checked={splitEqually}
              onChange={(e) => setSplitEqually(e.target.checked)} className="rounded" />
            平均分摊
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m, idx) => {
            const isOn = sharedWith.includes(m.id);
            const col  = PAID_COLORS[idx % PAID_COLORS.length];
            return (
              <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold transition-all ${
                  isOn ? `${col.bg} ${col.text}` : "bg-surface text-ink-faint"
                }`}
                style={{ boxShadow: isOn ? "0 3px 12px rgba(0,0,0,0.18)" : "var(--shadow-card)", opacity: isOn ? 1 : 0.5 }}>
                <span className="text-base">{m.emoji}</span>
                {m.name}
              </button>
            );
          })}
        </div>
        {sharedWith.length > 0 && amountKrw && splitEqually && (
          <p className="mt-2 text-xs text-ink-muted font-medium">
            每人 ₩{Math.floor(parseFloat(amountKrw) / sharedWith.length).toLocaleString("ko-KR")}
          </p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="label">日期</label>
        <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)}
          required className="input" />
      </div>

      {/* Notes */}
      <div>
        <label className="label">备注（选填）</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="任何备注…" rows={2} className="input resize-none" />
      </div>

      {/* Photo attachment */}
      <div>
        <label className="label">附上收据照片（选填）</label>
        {photo ? (
          <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="收据" className="w-full max-h-48 object-cover" />
            <button type="button" onClick={() => setPhoto(null)}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => { tap(); fileRef.current?.click(); }}
            className="w-full rounded-2xl bg-surface border-2 border-dashed border-ink-faint/30 py-4 flex flex-col items-center gap-1.5 transition-all active:scale-[0.98]"
            style={{ boxShadow: "var(--shadow-card)" }}>
            <ImagePlus className="h-6 w-6 text-ink-faint" />
            <p className="text-xs font-semibold text-ink-muted">点击拍照或选择图片</p>
            <p className="text-[10px] text-ink-faint">不拍也可以直接记录</p>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={handlePhoto} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">取消</button>
        <button type="submit" disabled={loading}
          className="btn-primary flex-1 disabled:opacity-60">
          {loading ? (isEditMode ? "更新中…" : "记录中…") : (isEditMode ? "更新" : "记录消费")}
        </button>
      </div>
    </form>
  );
}
