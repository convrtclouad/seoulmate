"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X, ChevronRight } from "lucide-react";
import { getMembersSync, EMOJI_OPTIONS, COLOR_OPTIONS } from "@/lib/hooks/useMembers";
import type { Member } from "@/lib/hooks/useMembers";

const LS_MEMBERS = "seoulmate_members";

const DEFAULT_MEMBERS: Member[] = [
  { id: "bryan", name: "Bryan", emoji: "🧑‍💻", color: "from-emerald-400 to-teal-500" },
  { id: "sarah", name: "Sarah", emoji: "👩‍🎨", color: "from-violet-400 to-purple-500" },
  { id: "mike",  name: "Mike",  emoji: "🧑‍🍳", color: "from-orange-400 to-amber-500" },
  { id: "priya", name: "Priya", emoji: "👩‍✈️", color: "from-rose-400 to-pink-500" },
];

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
    // Already picked? Go home
    const stored = localStorage.getItem("seoulmate_user");
    if (stored) { router.replace("/home"); return; }
    setMembers(getMembersSync());
  }, [router]);

  function removeMember(id: string) {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    saveMembers(updated);
    if (selected === id) setSelected(null);
  }

  function addMember() {
    if (!newName.trim()) return;
    const m: Member = {
      id: newName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      name: newName.trim(),
      emoji: newEmoji,
      color: newColor,
    };
    const updated = [...members, m];
    setMembers(updated);
    saveMembers(updated);
    setNewName("");
    setNewEmoji("😊");
    setShowAdd(false);
  }

  function handleEnter() {
    if (!selected) return;
    setEntering(true);
    localStorage.setItem("seoulmate_user", selected);
    const m = members.find((f) => f.id === selected);
    if (m) {
      localStorage.setItem("seoulmate_user_name", m.name);
      localStorage.setItem("seoulmate_user_emoji", m.emoji);
    }
    setTimeout(() => router.push("/home"), 350);
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Hero */}
      <div className="bg-forest px-6 pt-16 pb-10 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-forest-light/40" />
        <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-forest-light/30" />
        <div className="relative z-10">
          <div className="text-6xl mb-3" style={{ animation: "planeBob 2s ease-in-out infinite", display: "inline-block" }}>
            ✈️
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">SeoulMate</h1>
          <p className="text-forest-pale text-sm mt-2 font-medium">首尔旅游伴侣 · 2026</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2">
            <span className="text-white/80 text-xs font-medium">📅 5月8日 – 5月16日, 2026</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 pt-7 pb-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">你是谁？</h2>
            <p className="text-sm text-neutral-400 mt-0.5">选择你的档案</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-forest-mist text-forest text-sm font-semibold rounded-xl px-3 py-2"
          >
            <Plus className="h-4 w-4" /> 新增成员
          </button>
        </div>

        {/* Member grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {members.map((m) => {
            const isSelected = selected === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={`
                  relative flex flex-col items-center gap-3 rounded-3xl p-5
                  bg-surface shadow-card transition-all duration-200 active:scale-95
                  ${isSelected ? "ring-2 ring-forest shadow-card-hover" : "hover:shadow-card-hover"}
                `}
              >
                {/* Delete */}
                {members.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeMember(m.id); }}
                    className="absolute top-2 left-2 h-5 w-5 rounded-full bg-neutral-100 flex items-center justify-center opacity-60 hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-neutral-500" />
                  </button>
                )}
                {/* Checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-forest flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-3xl shadow-sm`}>
                  {m.emoji}
                </div>
                <span className="font-bold text-gray-900 text-base">{m.name}</span>
              </button>
            );
          })}
        </div>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          disabled={!selected || entering}
          className={`
            w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2
            transition-all duration-300 active:scale-95
            ${selected
              ? "bg-forest text-white shadow-float hover:bg-forest-light"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            }
          `}
        >
          {entering ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              起飞中…
            </>
          ) : selected ? (
            <>出发！{members.find(f => f.id === selected)?.emoji} <ChevronRight className="h-4 w-4" /></>
          ) : (
            "请选择你的档案"
          )}
        </button>

        <p className="text-center text-xs text-neutral-400 mt-4">
          所有成员共享同一份旅游数据 · 无需密码
        </p>
      </div>

      {/* Add member sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-t-3xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">新增成员</h3>

            <label className="label">名字</label>
            <input
              className="input mb-4"
              placeholder="输入名字"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={20}
            />

            <label className="label">头像表情</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`text-2xl p-1.5 rounded-xl transition-all ${newEmoji === e ? "bg-forest-mist ring-2 ring-forest scale-110" : "hover:bg-neutral-100"}`}
                >
                  {e}
                </button>
              ))}
            </div>

            <label className="label">颜色</label>
            <div className="flex gap-2 mb-6">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`h-8 w-8 rounded-full bg-gradient-to-br ${c} transition-all ${newColor === c ? "ring-2 ring-offset-2 ring-forest scale-110" : ""}`}
                />
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
        @keyframes planeBob {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50%       { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}
