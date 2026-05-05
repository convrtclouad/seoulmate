"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, Plus, X, Save, ImagePlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useMembers } from "@/lib/hooks/useMembers";
import { format, addDays, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { tap, success } from "@/lib/utils/haptics";

const TRIP_START = new Date("2026-05-07");
const TRIP_END   = new Date("2026-05-15");
const TRIP_DAYS  = Array.from({ length: differenceInDays(TRIP_END, TRIP_START) + 1 }, (_, i) => addDays(TRIP_START, i));
const LS_KEY     = "seoulmate_journal";

interface JournalEntry {
  date: string;
  text: string;
  mood: string;
  photos: string[]; // base64 data URLs
  updated_at: string;
}

function load(): Record<string, JournalEntry> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"); } catch { return {}; }
}
function save(entries: Record<string, JournalEntry>) { localStorage.setItem(LS_KEY, JSON.stringify(entries)); }

const MOODS = ["😊", "🥰", "😄", "😎", "😌", "😴", "🤩", "😋", "🥵", "🌧️"];

export default function JournalPage() {
  const { data: members = [] } = useMembers();
  const [entries, setEntries]     = useState<Record<string, JournalEntry>>({});
  const [selected, setSelected]   = useState(format(TRIP_DAYS[0], "yyyy-MM-dd"));
  const [editing, setEditing]     = useState(false);
  const [draft, setDraft]         = useState("");
  const [mood, setMood]           = useState("😊");
  const [photos, setPhotos]       = useState<string[]>([]);
  const [photoIdx, setPhotoIdx]   = useState(0);
  const fileRef                   = useRef<HTMLInputElement>(null);

  useEffect(() => { setEntries(load()); }, []);

  const entry = entries[selected];

  function startEdit() {
    tap();
    setDraft(entry?.text ?? "");
    setMood(entry?.mood ?? "😊");
    setPhotos(entry?.photos ?? []);
    setEditing(true);
  }

  function saveEntry() {
    success();
    const updated = {
      ...entries,
      [selected]: { date: selected, text: draft, mood, photos, updated_at: new Date().toISOString() },
    };
    setEntries(updated); save(updated); setEditing(false);
  }

  function deleteEntry() {
    const updated = { ...entries };
    delete updated[selected];
    setEntries(updated); save(updated); setEditing(false);
  }

  function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // reset input so same file can be re-selected
    e.target.value = "";
  }

  function removePhoto(idx: number) {
    tap();
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    if (photoIdx >= photos.length - 1) setPhotoIdx(Math.max(0, photos.length - 2));
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
              <button key={i} onClick={() => { tap(); setSelected(key); setEditing(false); }}
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
          <div className="animate-slide-up space-y-4 pb-8">
            {/* Mood picker */}
            <div>
              <label className="label">今天的心情</label>
              <div className="flex gap-2 flex-wrap">
                {MOODS.map((m) => (
                  <button key={m} onClick={() => { tap(); setMood(m); }}
                    className={`text-2xl p-2 rounded-2xl transition-all ${mood === m ? "bg-lavender-100 scale-110" : "hover:bg-black/5"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <label className="label">今天的照片（选填）</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {photos.map((src, idx) => (
                  <div key={idx} className="relative shrink-0 h-24 w-24 rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`照片 ${idx + 1}`} className="h-full w-full object-cover" />
                    <button onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center">
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                {/* Add photo button */}
                <button onClick={() => { tap(); fileRef.current?.click(); }}
                  className="shrink-0 h-24 w-24 rounded-2xl border-2 border-dashed border-lavender/30 bg-lavender-50 flex flex-col items-center justify-center gap-1 transition-all active:scale-95">
                  <ImagePlus className="h-6 w-6 text-lavender/50" />
                  <span className="text-[10px] text-lavender/60 font-semibold">添加照片</span>
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple capture="environment"
                className="hidden" onChange={handlePhotoAdd} />
            </div>

            {/* Text */}
            <div>
              <label className="label">今天的故事</label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`${format(new Date(selected + "T00:00:00"), "M月d日")} 的旅程…`}
                rows={8}
                className="input resize-none text-sm leading-relaxed"
              />
            </div>

            <div className="flex gap-3">
              {entry && (
                <button onClick={deleteEntry} className="btn-ghost text-petal-400">
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
          <div className="animate-fade-in space-y-3 pb-24">
            {/* Photo gallery */}
            {entry.photos?.length > 0 && (
              <div className="rounded-3xl overflow-hidden relative" style={{ boxShadow: "var(--shadow-card)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.photos[photoIdx]} alt="照片"
                  className="w-full aspect-[4/3] object-cover" />
                {entry.photos.length > 1 && (
                  <>
                    <button onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center">
                      <ChevronLeft className="h-4 w-4 text-white" />
                    </button>
                    <button onClick={() => setPhotoIdx((i) => Math.min(entry.photos.length - 1, i + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center">
                      <ChevronRight className="h-4 w-4 text-white" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                      {entry.photos.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === photoIdx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="rounded-3xl bg-surface p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{entry.mood}</span>
                  <div>
                    <p className="font-bold text-ink text-sm">
                      {format(new Date(selected + "T00:00:00"), "M月d日 EEEE", { locale: zhCN })}
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
              {entry.text ? (
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{entry.text}</p>
              ) : (
                <p className="text-sm text-ink-faint italic">（没有文字，只有照片）</p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <BookOpen className="h-12 w-12 text-lavender-200 mx-auto mb-3" />
            <p className="font-bold text-ink text-sm">
              {format(new Date(selected + "T00:00:00"), "M月d日")} 还没有日志
            </p>
            <p className="text-xs text-ink-muted mt-1">记录今天的故事和照片吧</p>
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
