"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { usePrepare, useAddPrepareItem, useTogglePrepareItem, useRemovePrepareItem } from "@/lib/hooks/usePrepare";
import type { PrepareCategory } from "@/lib/hooks/usePrepare";
import { useMembers } from "@/lib/hooks/useMembers";
import { LoadingPlane } from "@/components/ui/LoadingPlane";

const TABS: { key: PrepareCategory; label: string; emoji: string; color: string; bg: string }[] = [
  { key: "todo",     label: "待办", emoji: "✅", color: "text-sage-600",     bg: "bg-sage-100" },
  { key: "packing",  label: "行李", emoji: "🧳", color: "text-ginger-500",   bg: "bg-ginger-100" },
  { key: "wishlist", label: "想去", emoji: "❤️", color: "text-petal-400",    bg: "bg-petal-100" },
  { key: "shopping", label: "购物", emoji: "🛍️", color: "text-mist-400",     bg: "bg-mist-100" },
];

export default function PreparePage() {
  const { data: items = [], isLoading } = usePrepare();
  const { data: members = [] }          = useMembers();
  const addItem    = useAddPrepareItem();
  const toggleItem = useTogglePrepareItem();
  const removeItem = useRemovePrepareItem();

  const [activeTab, setActiveTab] = useState<PrepareCategory>("todo");
  const [newText, setNewText]     = useState("");
  const [showInput, setShowInput] = useState(false);

  const filtered = items.filter((i) => i.category === activeTab);
  const done     = filtered.filter((i) => i.done).length;
  const tab      = TABS.find((t) => t.key === activeTab)!;

  async function handleAdd() {
    if (!newText.trim()) return;
    await addItem.mutateAsync({ category: activeTab, text: newText.trim() });
    setNewText(""); setShowInput(false);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* Header */}
      <div className="px-5 pt-safe pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-ink tracking-tight">行前准备</h1>
            <p className="text-xs text-ink-muted mt-0.5">出发前要做的事 ✨</p>
          </div>
          {/* Members */}
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <div key={m.id} className={`h-8 w-8 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-sm ring-2 ring-cream`}>
                {m.emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-4 pt-2 pb-3">
        <div className="tab-bar">
          {TABS.map((t) => {
            const isActive = activeTab === t.key;
            const count = items.filter(i => i.category === t.key && !i.done).length;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={isActive ? "tab-item-active" : "tab-item-inactive"}>
                <span>{t.emoji}</span>
                <span className="text-xs font-bold">{t.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-black rounded-full px-1.5 py-0.5 ${isActive ? `${t.bg} ${t.color}` : "bg-black/10 text-ink-muted"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      {filtered.length > 0 && (
        <div className="px-4 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-ink-muted font-medium">{done}/{filtered.length} 完成</span>
            <span className="text-xs font-bold text-sage-600">{Math.round(done / filtered.length * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-black/5 overflow-hidden">
            <div className="h-full rounded-full bg-sage transition-all duration-500"
                 style={{ width: `${filtered.length ? (done / filtered.length * 100) : 0}%` }} />
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 px-4 pb-safe space-y-2.5">
        {isLoading ? (
          <LoadingPlane text="载入中…" />
        ) : filtered.length === 0 && !showInput ? (
          <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-4xl mb-3">{tab.emoji}</div>
            <p className="font-bold text-ink text-sm">{tab.label}清单是空的</p>
            <p className="text-xs text-ink-muted mt-1">点击下方 + 开始添加</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="checklist-item group">
              <button onClick={() => toggleItem.mutate(item.id)}
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  item.done ? `${tab.bg} border-transparent` : "border-ink-faint"
                }`}>
                {item.done && <Check className={`h-3.5 w-3.5 ${tab.color}`} strokeWidth={3} />}
              </button>
              <span className={`flex-1 text-sm font-medium transition-all ${item.done ? "line-through text-ink-faint" : "text-ink"}`}>
                {item.text}
              </span>
              <button onClick={() => removeItem.mutate(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-petal-400 p-1 rounded-xl">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}

        {/* Add input */}
        {showInput && (
          <div className="checklist-item gap-2 animate-slide-up">
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm text-ink placeholder-ink-faint outline-none"
              placeholder={`添加${tab.label}项目…`}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowInput(false); }}
            />
            <button onClick={handleAdd} className={`text-xs font-bold rounded-2xl px-3 py-1.5 ${tab.bg} ${tab.color}`}>添加</button>
            <button onClick={() => { setShowInput(false); setNewText(""); }}
              className="text-ink-faint hover:text-ink p-1 rounded-xl"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowInput(true)}
        className="fixed bottom-24 right-5 h-14 w-14 rounded-full bg-sage text-white flex items-center justify-center z-30"
        style={{ boxShadow: "0 6px 24px rgba(91,136,98,0.35)" }}>
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
