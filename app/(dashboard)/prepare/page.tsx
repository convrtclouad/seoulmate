"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { usePrepare, useAddPrepareItem, useTogglePrepareItem, useRemovePrepareItem } from "@/lib/hooks/usePrepare";
import type { PrepareCategory } from "@/lib/hooks/usePrepare";
import { useMembers } from "@/lib/hooks/useMembers";
import { LoadingPlane } from "@/components/ui/LoadingPlane";
import { tap, warn } from "@/lib/utils/haptics";

const TABS: { key: PrepareCategory; label: string; emoji: string; color: string; bg: string; solid: string }[] = [
  { key: "todo",     label: "待办", emoji: "✅", color: "text-sage-600",   bg: "bg-sage-100",   solid: "#5B8862" },
  { key: "packing",  label: "行李", emoji: "🧳", color: "text-ginger-500", bg: "bg-ginger-100", solid: "#E8A800" },
  { key: "wishlist", label: "想去", emoji: "❤️", color: "text-petal-400",  bg: "bg-petal-100",  solid: "#E87060" },
  { key: "shopping", label: "采购", emoji: "🛍️", color: "text-mist-400",   bg: "bg-mist-100",   solid: "#6BA3BE" },
];

export default function PreparePage() {
  const { data: items = [], isLoading } = usePrepare();
  const { data: members = [] }          = useMembers();
  const addItem    = useAddPrepareItem();
  const toggleItem = useTogglePrepareItem();
  const removeItem = useRemovePrepareItem();

  const [activeTab,     setActiveTab]     = useState<PrepareCategory>("todo");
  const [filterMember,  setFilterMember]  = useState<string | null>(null);
  const [showInput,     setShowInput]     = useState(false);
  const [newText,       setNewText]       = useState("");
  const [newAssignees,  setNewAssignees]  = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const tab      = TABS.find((t) => t.key === activeTab)!;
  const tabItems = items.filter((i) => i.category === activeTab);
  const filtered = filterMember
    ? tabItems.filter((i) => !i.assignees?.length || i.assignees.includes(filterMember))
    : tabItems;
  const done     = filtered.filter((i) => i.done).length;

  function toggleAssignee(id: string) {
    tap();
    setNewAssignees((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleAdd() {
    if (!newText.trim()) return;
    tap();
    await addItem.mutateAsync({ category: activeTab, text: newText.trim(), assignees: newAssignees });
    setNewText(""); setNewAssignees([]); setShowInput(false);
  }

  function handleDeleteClick(id: string) {
    if (confirmDelete === id) {
      warn();
      removeItem.mutate(id);
      setConfirmDelete(null);
    } else {
      tap();
      setConfirmDelete(id);
    }
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
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <div key={m.id} className={`h-8 w-8 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-sm ring-2 ring-cream`}>
                {m.emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category tab bar */}
      <div className="px-4 pt-2 pb-2">
        <div className="tab-bar">
          {TABS.map((t) => {
            const isActive = activeTab === t.key;
            const pending  = items.filter((i) => i.category === t.key && !i.done).length;
            return (
              <button key={t.key} onClick={() => { tap(); setActiveTab(t.key); setFilterMember(null); }}
                className={isActive ? "tab-item-active" : "tab-item-inactive"}>
                <span>{t.emoji}</span>
                <span className="text-xs font-bold">{t.label}</span>
                {pending > 0 && (
                  <span className={`text-[10px] font-black rounded-full px-1.5 py-0.5 ${
                    isActive ? `${t.bg} ${t.color}` : "bg-black/10 text-ink-muted"
                  }`}>{pending}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Member filter row */}
      {members.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button onClick={() => { tap(); setFilterMember(null); }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                !filterMember ? "bg-ink text-cream" : "bg-surface text-ink-muted"
              }`} style={{ boxShadow: "var(--shadow-card)" }}>
              全部
            </button>
            {members.map((m) => {
              const isSel = filterMember === m.id;
              return (
                <button key={m.id} onClick={() => { tap(); setFilterMember(isSel ? null : m.id); }}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    isSel ? `${tab.bg} ${tab.color}` : "bg-surface text-ink-mid"
                  }`} style={{ boxShadow: "var(--shadow-card)" }}>
                  <span>{m.emoji}</span>
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {filtered.length > 0 && (
        <div className="px-4 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-ink-muted font-medium">{done}/{filtered.length} 完成</span>
            <span className={`text-xs font-bold ${tab.color}`}>
              {Math.round(done / filtered.length * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-black/5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${filtered.length ? (done / filtered.length * 100) : 0}%`, background: tab.solid }} />
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 px-4 pb-32 space-y-2.5">
        {isLoading ? (
          <LoadingPlane text="载入中…" />
        ) : filtered.length === 0 && !showInput ? (
          <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-4xl mb-3">{tab.emoji}</div>
            <p className="font-bold text-ink text-sm">{tab.label}清单是空的</p>
            <p className="text-xs text-ink-muted mt-1">点击下方 + 开始添加</p>
          </div>
        ) : (
          <>
            {filtered.map((item) => {
              const isConfirm  = confirmDelete === item.id;
              const itemMembers = members.filter((m) => (item.assignees ?? []).includes(m.id));
              return (
                <div key={item.id}
                     className={`rounded-3xl bg-surface p-4 flex items-start gap-3 transition-all ${item.done ? "opacity-60" : ""}`}
                     style={{ boxShadow: "var(--shadow-card)" }}>
                  {/* Checkbox */}
                  <button onClick={() => { tap(); toggleItem.mutate(item.id); }}
                    className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      item.done ? `${tab.bg} border-transparent` : "border-ink-faint"
                    }`}>
                    {item.done && <Check className={`h-3.5 w-3.5 ${tab.color}`} strokeWidth={3} />}
                  </button>

                  {/* Text + member tags */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${item.done ? "line-through text-ink-faint" : "text-ink"}`}>
                      {item.text}
                    </span>
                    {itemMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {itemMembers.map((m) => (
                          <span key={m.id}
                            className={`inline-flex items-center gap-0.5 text-[10px] font-bold rounded-full px-2 py-0.5 ${tab.bg} ${tab.color}`}>
                            {m.emoji} {m.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delete / confirm */}
                  {isConfirm ? (
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <button onClick={() => { warn(); removeItem.mutate(item.id); setConfirmDelete(null); }}
                        className="text-[10px] font-bold bg-petal-100 text-petal-400 rounded-xl px-2.5 py-1.5">
                        确认删除
                      </button>
                      <button onClick={() => { tap(); setConfirmDelete(null); }}
                        className="text-[10px] font-bold bg-black/5 text-ink-muted rounded-xl px-2.5 py-1.5">
                        取消
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleDeleteClick(item.id)}
                      className="mt-0.5 shrink-0 h-7 w-7 rounded-full bg-black/5 flex items-center justify-center transition-colors hover:bg-petal-100">
                      <X className="h-3.5 w-3.5 text-ink-muted" />
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Add input inline */}
        {showInput && (
          <div className="rounded-3xl bg-surface p-4 space-y-3 animate-slide-up"
               style={{ boxShadow: "var(--shadow-card)" }}>
            <input autoFocus
              className="w-full bg-transparent text-sm text-ink placeholder-ink-faint outline-none font-medium"
              placeholder={`添加${tab.label}项目…`}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setShowInput(false); setNewText(""); } }}
            />
            {/* Member assignee selector */}
            {members.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-ink-faint mb-2 uppercase tracking-wider">指定成员（选填）</p>
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => {
                    const isSel = newAssignees.includes(m.id);
                    return (
                      <button key={m.id} type="button" onClick={() => toggleAssignee(m.id)}
                        className={`flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1 transition-all ${
                          isSel ? `${tab.bg} ${tab.color}` : "bg-black/5 text-ink-muted"
                        }`}>
                        {m.emoji} {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowInput(false); setNewText(""); setNewAssignees([]); }}
                className="btn-secondary flex-1 text-sm py-2">取消</button>
              <button onClick={handleAdd} disabled={!newText.trim()}
                className="flex-1 text-sm py-2 rounded-2xl font-bold transition-all disabled:opacity-40"
                style={{ background: tab.solid, color: "white" }}>
                添加
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      {!showInput && (
        <button onClick={() => { tap(); setShowInput(true); }}
          className="fixed bottom-24 right-5 h-14 w-14 rounded-full bg-sage text-white flex items-center justify-center z-30"
          style={{ boxShadow: "0 6px 24px rgba(91,136,98,0.35)" }}>
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
