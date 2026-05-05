"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X, ChevronRight } from "lucide-react";
import { getMembersSync, EMOJI_OPTIONS, COLOR_OPTIONS } from "@/lib/hooks/useMembers";
import type { Member } from "@/lib/hooks/useMembers";

const LS_MEMBERS = "seoulmate_members";

function saveMembers(members: Member[]) {
  localStorage.setItem(LS_MEMBERS, JSON.stringify(members));
}

export default function IntroPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("😊");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);

  useEffect(() => {
    const stored = localStorage.getItem("seoulmate_user");
    if (stored) { router.replace("/home"); return; }
    setMembers(getMembersSync());
  }, [router]);

  function removeMember(id: string) {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated); saveMembers(updated);
    if (selected === id) setSelected(null);
  }

  function addMember() {
    if (!newName.trim()) return;
    const m: Member = { id: newName.toLowerCase().replace(/\s+/g,"-")+"-"+Date.now(), name: newName.trim(), emoji: newEmoji, color: newColor };
    const updated = [...members, m];
    setMembers(updated); saveMembers(updated);
    setNewName(""); setNewEmoji("😊"); setShowAdd(false);
  }

  function handleEnter() {
    if (!selected || entering) return;
    setEntering(true);
    localStorage.setItem("seoulmate_user", selected);
    const m = members.find(f => f.id === selected);
    if (m) { localStorage.setItem("seoulmate_user_name", m.name); localStorage.setItem("seoulmate_user_emoji", m.emoji); }
    setTimeout(() => router.push("/home"), 350);
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col">
      {/* Hero */}
      <div className="px-6 pt-16 pb-8 text-center">
        <div className="text-7xl mb-4 inline-block animate-plane-bob">✈️</div>
        <h1 className="text-3xl font-black text-ink tracking-tight">SeoulMate</h1>
        <p className="text-ink-muted text-sm mt-2">首尔旅游小助手 · 2026</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-ginger-100 text-ginger-500 rounded-full px-4 py-2 text-xs font-semibold">
          📅 5月8日 – 5月16日, 2026
        </div>
      </div>

      <div className="flex-1 px-5 pb-10">
        {/* Member picker */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-ink">你是谁？</h2>
            <p className="text-xs text-ink-muted mt-0.5">选择你的旅行档案</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-sage-100 text-sage-600 text-xs font-bold rounded-2xl px-3 py-2">
            <Plus className="h-3.5 w-3.5" /> 新增
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {members.map((m) => {
            const isSelected = selected === m.id;
            return (
              <button key={m.id} onClick={() => setSelected(m.id)}
                className="relative flex flex-col items-center gap-3 rounded-3xl p-5 bg-surface transition-all duration-200 active:scale-95"
                style={{ boxShadow: isSelected ? `0 0 0 2px #5B8862, ${`var(--shadow-lift)`}` : "var(--shadow-card)" }}
              >
                {members.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); removeMember(m.id); }}
                    className="absolute top-2.5 left-2.5 h-5 w-5 rounded-full bg-black/5 flex items-center justify-center">
                    <X className="h-3 w-3 text-ink-muted" />
                  </button>
                )}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-sage flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className={`h-16 w-16 rounded-3xl bg-gradient-to-br ${m.color} flex items-center justify-center text-3xl`}
                     style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
                  {m.emoji}
                </div>
                <span className="font-bold text-ink text-base">{m.name}</span>
              </button>
            );
          })}
        </div>

        {/* Enter */}
        <button onClick={handleEnter} disabled={!selected || entering}
          className="w-full py-4 rounded-3xl text-base font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
          style={{
            background: selected ? "#5B8862" : "rgba(0,0,0,0.07)",
            color: selected ? "#fff" : "#CECDCB",
            boxShadow: selected ? "0 6px 24px rgba(91,136,98,0.32)" : "none",
          }}
        >
          {entering ? (
            <><span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />起飞中…</>
          ) : selected ? (
            <>出发！{members.find(f => f.id === selected)?.emoji} <ChevronRight className="h-4 w-4" /></>
          ) : "请先选择你的档案"}
        </button>

        <p className="text-center text-xs text-ink-faint mt-4 leading-relaxed">
          所有成员共享同一份旅游数据 · 无需密码
        </p>
      </div>

      {/* Add member sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.3)" }}
             onClick={() => setShowAdd(false)}>
          <div className="bg-cream rounded-t-4xl p-6 pb-10 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-ink-faint mx-auto mb-5" />
            <h3 className="text-lg font-bold text-ink mb-4">新增成员</h3>

            <label className="label">名字</label>
            <input className="input mb-4" placeholder="输入名字" value={newName}
              onChange={(e) => setNewName(e.target.value)} maxLength={20} />

            <label className="label">头像表情</label>
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
              <button onClick={addMember} disabled={!newName.trim()} className="btn-primary flex-1">添加</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes plane-bob { 0%,100% { transform:translateY(0) rotate(-4deg); } 50% { transform:translateY(-12px) rotate(2deg); } }
        .animate-plane-bob { animation: plane-bob 2.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
