"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, X, Save } from "lucide-react";
import { useMembers } from "@/lib/hooks/useMembers";
import { format, addDays, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";

const TRIP_START = new Date("2026-05-08");
const TRIP_END   = new Date("2026-05-16");
const TRIP_DAYS  = Array.from({ length: differenceInDays(TRIP_END, TRIP_START) + 1 }, (_, i) => addDays(TRIP_START, i));
const LS_KEY     = "seoulmate_journal";

interface JournalEntry { date: string; text: string; mood: string; updated_at: string; }

function load(): Record<string, JournalEntry> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"); } catch { return {}; }
}
function save(entries: Record<string, JournalEntry>) { localStorage.setItem(LS_KEY, JSON.stringify(entries)); }

const MOODS = ["😊", "🥰", "😄", "😎", "😌", "😴", "🤩", "😋", "🥵", "🌧️"];

export default function JournalPage() {
  const { data: members = [] } = useMembers();
  const [entries, setEntries]   = useState<Record<string, JournalEntry>>({});
  const [selected, setSelected] = useState(format(TRIP_DAYS[0], "yyyy-MM-dd"));
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState("");
  const [mood, setMood]         = useState("😊");

  useEffect(() => { setEntries(load()); }, []);

  const entry = entries[selected];

  function startEdit() {
    setDraft(entry?.text ?? "");
    setMood(entry?.mood ?? "😊");
    setEditing(true);
  }

  function saveEntry() {
    const updated = { ...entries, [selected]: { date: selected, text: draft, mood, updated_at: new Date().toISOString() } };
    setEntries(updated); save(updated); setEditing(false);
  }

  function deleteEntry() {
    const updated = { ...entries };
    delete updated[selected];
    setEntries(updated); save(updated); setEditing(false);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* Header */}
      <div className="px-5 pt-safe pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-ink tracking-tight">旅游日志</h1>
            <p className="text-xs text-ink-muted mt-0.5">记录每天的美好回忆 ✨</p>
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

      {/* Day tabs */}
      <div className="px-4 pt-3 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TRIP_DAYS.map((day, i) => {
            const key = format(day, "yyyy-MM-dd");
            const isActive = key === selected;
            const hasEntry = !!entries[key];
            return (
              <button key={i} onClick={() => { setSelected(key); setEditing(false); }}
                className="flex flex-col items-center shrink-0 rounded-2xl px-3 py-2.5 transition-all duration-200"
                style={{
                  background: isActive ? "#8B7AB8" : "#FFFFFF",
                  boxShadow: isActive ? "0 4px 16px rgba(139,122,184,0.35)" : "var(--shadow-card)",
                  minWidth: 52,
                }}>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-white/70" : "text-ink-faint"}`}>
                  DAY{i + 1}
                </span>
                <span className={`text-lg font-black ${isActive ? "text-white" : "text-ink"}`}>{format(day, "d")}</span>
                <span className={`text-[9px] ${isActive ? "text-white/60" : "text-ink-faint"}`}>{format(day, "EEE", { locale: zhCN })}</span>
                {hasEntry && !isActive && <div className="h-1.5 w-1.5 rounded-full bg-lavender-300 mt-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Journal content */}
      <div className="flex-1 px-4 pb-safe">
        {editing ? (
          <div className="animate-slide-up">
            {/* Mood picker */}
            <div className="mb-4">
              <label className="label">今天的心情</label>
              <div className="flex gap-2 flex-wrap">
                {MOODS.map((m) => (
                  <button key={m} onClick={() => setMood(m)}
                    className={`text-2xl p-2 rounded-2xl transition-all ${mood === m ? "bg-lavender-100 scale-110" : "hover:bg-black/5"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <label className="label">今天的故事</label>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`${format(new Date(selected), "M月d日")} 的旅程…`}
              rows={10}
              className="input resize-none text-sm leading-relaxed mb-4"
            />
            <div className="flex gap-3">
              {entry && (
                <button onClick={deleteEntry} className="btn-ghost text-petal-400 hover:text-petal-400">
                  <X className="h-4 w-4" /> 删除
                </button>
              )}
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1">取消</button>
              <button onClick={saveEntry} className="btn-primary flex-1">
                <Save className="h-4 w-4" /> 保存
              </button>
            </div>
          </div>
        ) : entry ? (
          <div className="animate-fade-in">
            <div className="rounded-3xl bg-surface p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{entry.mood}</span>
                  <div>
                    <p className="font-bold text-ink text-sm">
                      {format(new Date(selected), "M月d日 EEEE", { locale: zhCN })}
                    </p>
                    <p className="text-[10px] text-ink-faint">
                      {format(new Date(entry.updated_at), "HH:mm 更新")}
                    </p>
                  </div>
                </div>
                <button onClick={startEdit}
                  className="text-xs font-bold text-lavender bg-lavender-100 rounded-2xl px-3 py-1.5">
                  编辑
                </button>
              </div>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{entry.text}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <BookOpen className="h-12 w-12 text-lavender-200 mx-auto mb-3" />
            <p className="font-bold text-ink text-sm">
              {format(new Date(selected), "M月d日")} 还没有日志
            </p>
            <p className="text-xs text-ink-muted mt-1">记录今天的故事和心情吧</p>
            <button onClick={startEdit} className="btn-primary mt-5 mx-auto">
              <Plus className="h-4 w-4" /> 写日志
            </button>
          </div>
        )}
      </div>

      {/* FAB */}
      {!editing && (
        <button onClick={startEdit}
          className="fixed bottom-24 right-5 h-14 w-14 rounded-full text-white flex items-center justify-center z-30"
          style={{ background: "#8B7AB8", boxShadow: "0 6px 24px rgba(139,122,184,0.35)" }}>
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
