"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash2, Check, UserPlus } from "lucide-react";
import { useMembers, useAddMember, useRemoveMember, EMOJI_OPTIONS, COLOR_OPTIONS } from "@/lib/hooks/useSupabaseMembers";
import type { Member } from "@/lib/hooks/useSupabaseMembers";
import { tap, warn, success } from "@/lib/utils/haptics";

export default function MembersPage() {
  const { data: members = [] } = useMembers();
  const addMember    = useAddMember();
  const removeMember = useRemoveMember();

  const [currentId,    setCurrentId]    = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [newName,      setNewName]      = useState("");
  const [newEmoji,     setNewEmoji]     = useState("🐱");
  const [newColor,     setNewColor]     = useState(COLOR_OPTIONS[0]);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    setCurrentId(localStorage.getItem("seoulmate_user") ?? "");
  }, []);

  async function handleAdd() {
    if (!newName.trim() || saving) return;
    setSaving(true);
    success();
    try {
      await addMember.mutateAsync({ name: newName.trim(), emoji: newEmoji, color: newColor });
      setNewName(""); setNewEmoji("🐱"); setNewColor(COLOR_OPTIONS[0]);
      setShowAdd(false);
    } finally { setSaving(false); }
  }

  function handleDelete(m: Member) {
    if (m.id === currentId) return;
    tap();
    setDeleteTarget(m);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    warn();
    removeMember.mutate(deleteTarget.id);
    setDeleteTarget(null);
  }

  function switchUser(id: string) {
    tap();
    const m = members.find((x) => x.id === id);
    if (!m) return;
    localStorage.setItem("seoulmate_user",       id);
    localStorage.setItem("seoulmate_user_name",  m.name);
    localStorage.setItem("seoulmate_user_emoji", m.emoji);
    setCurrentId(id);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* Header */}
      <div className="px-5 pt-safe pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black text-ink tracking-tight">旅游成员</h1>
            <p className="text-xs text-ink-muted mt-0.5">管理旅行伙伴 · 点击切换身份 👤</p>
          </div>
          <button onClick={() => { tap(); setShowAdd(true); }}
            className="flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold text-white"
            style={{ background: "#5B8862", boxShadow: "0 4px 14px rgba(91,136,98,0.35)" }}>
            <UserPlus className="h-3.5 w-3.5" /> 新增
          </button>
        </div>
      </div>

      {/* Member grid */}
      <div className="px-4 pb-32">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {members.map((m) => {
            const isMe = m.id === currentId;
            return (
              <div key={m.id}
                role="button" tabIndex={0}
                onClick={() => switchUser(m.id)}
                onKeyDown={(e) => e.key === "Enter" && switchUser(m.id)}
                className="relative flex flex-col items-center gap-3 rounded-3xl pt-6 pb-4 px-4 cursor-pointer select-none transition-all active:scale-95"
                style={{
                  background: isMe ? "#F4FAF5" : "white",
                  boxShadow:  isMe
                    ? "0 0 0 2.5px #5B8862, 0 8px 28px rgba(91,136,98,0.18)"
                    : "var(--shadow-card)",
                }}>
                {/* Delete button */}
                {!isMe && members.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(m); }}
                    className="absolute top-2.5 left-2.5 h-6 w-6 rounded-full bg-black/6 flex items-center justify-center z-10">
                    <X className="h-3 w-3 text-ink-muted" />
                  </button>
                )}
                {/* Active check */}
                {isMe && (
                  <div className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-sage flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-4xl`}
                     style={{ boxShadow: isMe ? "0 6px 20px rgba(91,136,98,0.28)" : "0 4px 14px rgba(0,0,0,0.12)" }}>
                  {m.emoji}
                </div>
                <span className="font-bold text-ink text-sm">{m.name}</span>
                {isMe && (
                  <span className="text-[10px] font-bold text-sage-600 bg-sage-100 rounded-full px-2.5 py-0.5">
                    当前身份
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="rounded-3xl bg-surface p-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs font-bold text-ink mb-1.5">💡 使用说明</p>
          <ul className="space-y-1 text-xs text-ink-muted">
            <li>· 点击成员卡片可切换当前使用身份</li>
            <li>· 所有成员共享同一份旅游数据</li>
            <li>· 不能删除自己的档案</li>
            <li>· 新增成员后立即在全部功能生效</li>
          </ul>
        </div>
      </div>

      {/* ── Delete confirmation sheet ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
             style={{ background: "rgba(0,0,0,0.35)" }}
             onClick={() => { tap(); setDeleteTarget(null); }}>
          <div className="bg-cream rounded-t-4xl p-6 pb-10 animate-slide-up"
               onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-ink-faint mx-auto mb-5" />
            <div className="flex flex-col items-center gap-2 mb-5">
              <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${deleteTarget.color} flex items-center justify-center text-3xl`}>
                {deleteTarget.emoji}
              </div>
              <p className="font-bold text-ink text-base">{deleteTarget.name}</p>
            </div>
            <p className="text-center text-sm text-ink-muted mb-6">
              确认要删除 <span className="font-bold text-ink">{deleteTarget.name}</span> 的旅行档案吗？
            </p>
            <div className="flex gap-3">
              <button onClick={() => { tap(); setDeleteTarget(null); }} className="btn-secondary flex-1">取消</button>
              <button onClick={confirmDelete}
                className="flex-1 py-3 rounded-3xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: "#E87060", boxShadow: "0 4px 16px rgba(232,112,96,0.35)" }}>
                <Trash2 className="h-4 w-4" /> 确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add member sheet ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
             style={{ background: "rgba(0,0,0,0.3)" }}
             onClick={() => setShowAdd(false)}>
          <div className="bg-cream rounded-t-4xl animate-slide-up flex flex-col"
               style={{ maxHeight: "88dvh" }}
               onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-3 shrink-0">
              <div className="w-10 h-1 rounded-full bg-ink-faint mx-auto mb-4" />
              <h3 className="text-lg font-bold text-ink">新增旅行伙伴</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-4">
              <div>
                <label className="label">名字</label>
                <input className="input" placeholder="输入名字" value={newName}
                  onChange={(e) => setNewName(e.target.value)} maxLength={20}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
              </div>

              {/* Preview */}
              <div className="flex justify-center">
                <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${newColor} flex items-center justify-center text-4xl`}
                     style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.14)" }}>
                  {newEmoji}
                </div>
              </div>

              <div>
                <label className="label">选择头像</label>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button key={e} type="button" onClick={() => { tap(); setNewEmoji(e); }}
                      className={`text-2xl aspect-square flex items-center justify-center rounded-2xl transition-all ${
                        newEmoji === e ? "bg-sage-100 scale-110 shadow-sm" : "hover:bg-black/5"
                      }`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">背景颜色</label>
                <div className="flex flex-wrap gap-3">
                  {COLOR_OPTIONS.map((c) => (
                    <button key={c} type="button" onClick={() => { tap(); setNewColor(c); }}
                      className={`h-10 w-10 rounded-full bg-gradient-to-br ${c} transition-all ${
                        newColor === c ? "ring-2 ring-offset-2 ring-sage scale-110" : "opacity-70"
                      }`} />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowAdd(false); setNewName(""); }} className="btn-secondary flex-1">取消</button>
                <button onClick={handleAdd} disabled={!newName.trim() || saving} className="btn-primary flex-1">
                  {saving ? "添加中…" : "添加"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
