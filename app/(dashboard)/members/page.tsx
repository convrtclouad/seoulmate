"use client";

import { useState } from "react";
import { Plus, X, UserCircle2 } from "lucide-react";
import { useMembers, useAddMember, useRemoveMember, EMOJI_OPTIONS, COLOR_OPTIONS } from "@/lib/hooks/useMembers";
import { useExpenses } from "@/lib/hooks/useExpenses";
import { LoadingPlane } from "@/components/ui/LoadingPlane";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";

export default function MembersPage() {
  const { data: members = [], isLoading } = useMembers();
  const { data: expenses = [] }           = useExpenses(TRIP_ID);
  const addMember    = useAddMember();
  const removeMember = useRemoveMember();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("😊");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);

  const currentUser = typeof window !== "undefined" ? localStorage.getItem("seoulmate_user") : null;

  // Spending per member
  const spendMap = new Map<string, number>();
  for (const exp of expenses) {
    spendMap.set(exp.paid_by, (spendMap.get(exp.paid_by) ?? 0) + exp.amount_krw);
  }
  const totalKrw = expenses.reduce((s, e) => s + e.amount_krw, 0);

  async function handleAdd() {
    if (!newName.trim()) return;
    await addMember.mutateAsync({ name: newName.trim(), emoji: newEmoji, color: newColor });
    setNewName(""); setNewEmoji("😊"); setShowAdd(false);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* Header */}
      <div className="px-5 pt-safe pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-ink tracking-tight">旅行团成员</h1>
            <p className="text-xs text-ink-muted mt-0.5">{members.length} 位旅伴 🌟</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-sage text-white text-sm font-bold rounded-2xl px-4 py-2.5"
            style={{ boxShadow: "0 4px 12px rgba(91,136,98,0.30)" }}>
            <Plus className="h-4 w-4" /> 新增成员
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="flex-1 px-4 pb-safe space-y-3">
        {isLoading ? (
          <LoadingPlane text="载入成员中…" />
        ) : (
          members.map((m) => {
            const spent = spendMap.get(m.id) ?? 0;
            const pct   = totalKrw > 0 ? spent / totalKrw : 0;
            const isMe  = m.id === currentUser;
            return (
              <div key={m.id} className="rounded-3xl bg-surface p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-3">
                  <div className={`h-14 w-14 rounded-3xl bg-gradient-to-br ${m.color} flex items-center justify-center text-2xl shrink-0`}
                       style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-ink text-base">{m.name}</p>
                      {isMe && (
                        <span className="bg-sage-100 text-sage-600 text-[10px] font-bold rounded-full px-2 py-0.5">我</span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      已付 ₩{spent.toLocaleString("ko-KR")}
                    </p>
                  </div>
                  {members.length > 1 && (
                    <button onClick={() => removeMember.mutate(m.id)}
                      className="text-ink-faint hover:text-petal-400 p-2 rounded-2xl transition-colors hover:bg-petal-50">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Spend bar */}
                {totalKrw > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all duration-700`}
                           style={{ width: `${pct * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-ink-faint mt-1 text-right">
                      占总支出 {Math.round(pct * 100)}%
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Trip total */}
        {totalKrw > 0 && (
          <div className="rounded-3xl px-5 py-4"
               style={{ background: "linear-gradient(135deg, #5B8862, #4A9592)", boxShadow: "0 8px 24px rgba(91,136,98,0.25)" }}>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-airy">团体总支出</p>
            <p className="text-3xl font-black text-white mt-1">₩{totalKrw.toLocaleString("ko-KR")}</p>
            <p className="text-white/60 text-xs mt-1">共 {expenses.length} 笔消费</p>
          </div>
        )}
      </div>

      {/* Add member sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.3)" }}
             onClick={() => setShowAdd(false)}>
          <div className="bg-cream rounded-t-4xl p-6 pb-10 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-ink-faint mx-auto mb-5" />
            <h3 className="text-lg font-bold text-ink mb-4">新增旅伴</h3>
            <label className="label">名字</label>
            <input className="input mb-4" placeholder="输入名字" value={newName}
              onChange={(e) => setNewName(e.target.value)} maxLength={20} />
            <label className="label">头像</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} onClick={() => setNewEmoji(e)}
                  className={`text-2xl p-2 rounded-2xl transition-all ${newEmoji === e ? "bg-sage-100 scale-110" : "hover:bg-black/5"}`}>
                  {e}
                </button>
              ))}
            </div>
            <label className="label">颜色</label>
            <div className="flex gap-2.5 mb-6">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} onClick={() => setNewColor(c)}
                  className={`h-8 w-8 rounded-full bg-gradient-to-br ${c} transition-all ${newColor === c ? "ring-2 ring-offset-2 ring-sage scale-110" : ""}`} />
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">取消</button>
              <button onClick={handleAdd} disabled={!newName.trim()} className="btn-primary flex-1">添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
