"use client";

import { useState, useRef } from "react";
import { Plus, X, ExternalLink, Check, ImagePlus, MapPin } from "lucide-react";
import { useWishlist, useAddWishlistItem, useToggleVisited, useRemoveWishlistItem } from "@/lib/hooks/useWishlist";
import type { WishlistCategory } from "@/lib/hooks/useWishlist";
import { LoadingPlane } from "@/components/ui/LoadingPlane";
import { tap, success, warn } from "@/lib/utils/haptics";

const CATS: { key: WishlistCategory; label: string; emoji: string; bg: string; text: string }[] = [
  { key: "cafe",       label: "咖啡",  emoji: "☕", bg: "bg-ginger-100",  text: "text-ginger-500" },
  { key: "food",       label: "美食",  emoji: "🍜", bg: "bg-petal-100",   text: "text-petal-400"  },
  { key: "attraction", label: "景点",  emoji: "🏯", bg: "bg-sage-100",    text: "text-sage-600"   },
  { key: "shopping",   label: "购物",  emoji: "🛍️", bg: "bg-mist-100",    text: "text-mist-400"   },
  { key: "stay",       label: "住宿",  emoji: "🏨", bg: "bg-lavender-100",text: "text-lavender-400"},
  { key: "other",      label: "其他",  emoji: "📍", bg: "bg-black/5",     text: "text-ink-muted"  },
];

const LOCATIONS = ["首尔 Seoul", "釜山 Busan", "济州 Jeju", "仁川 Incheon", "庆州 Gyeongju", "其他"];

export default function WishlistPage() {
  const { data: items = [], isLoading } = useWishlist();
  const addItem     = useAddWishlistItem();
  const toggleItem  = useToggleVisited();
  const removeItem  = useRemoveWishlistItem();

  const [showForm,      setShowForm]      = useState(false);
  const [filterCat,     setFilterCat]     = useState<WishlistCategory | "all">("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form state
  const [fName,     setFName]     = useState("");
  const [fCat,      setFCat]      = useState<WishlistCategory>("cafe");
  const [fLocation, setFLocation] = useState("首尔 Seoul");
  const [fUrl,      setFUrl]      = useState("");
  const [fNotes,    setFNotes]    = useState("");
  const [fPhoto,    setFPhoto]    = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);

  const displayed = filterCat === "all" ? items : items.filter((i) => i.category === filterCat);
  const visitedCount = items.filter((i) => i.visited).length;

  function resetForm() {
    setFName(""); setFCat("cafe"); setFLocation("首尔 Seoul");
    setFUrl(""); setFNotes(""); setFPhoto(null);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFPhoto(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSave() {
    if (!fName.trim()) return;
    setSaving(true);
    try {
      await addItem.mutateAsync({
        name: fName.trim(), category: fCat, location: fLocation,
        url: fUrl.trim() || undefined, notes: fNotes.trim() || undefined,
        photo: fPhoto ?? undefined,
      });
      success();
      resetForm(); setShowForm(false);
    } finally { setSaving(false); }
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) { warn(); removeItem.mutate(id); setConfirmDelete(null); }
    else { tap(); setConfirmDelete(id); }
  }

  const catInfo = (key: WishlistCategory) => CATS.find((c) => c.key === key)!;

  return (
    <div className="flex flex-col min-h-dvh bg-cream">

      {/* Header */}
      <div className="px-5 pt-safe pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black text-ink tracking-tight">心愿打卡</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              {visitedCount}/{items.length} 个地方已打卡 ✨
            </p>
          </div>
          {/* Progress ring */}
          <div className="relative h-12 w-12 shrink-0">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="#5B8862" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - (items.length ? visitedCount / items.length : 0))}`}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-ink">
              {items.length ? Math.round(visitedCount / items.length * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => { tap(); setFilterCat("all"); }}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
            style={{ background: filterCat === "all" ? "#2A2826" : "#FFFFFF", color: filterCat === "all" ? "#F9F8F4" : "#5C5A58", boxShadow: "var(--shadow-card)" }}>
            全部 {items.length > 0 && `(${items.length})`}
          </button>
          {CATS.map((c) => {
            const count = items.filter((i) => i.category === c.key).length;
            if (count === 0 && filterCat !== c.key) return null;
            const isSel = filterCat === c.key;
            return (
              <button key={c.key} onClick={() => { tap(); setFilterCat(c.key); }}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${isSel ? `${c.bg} ${c.text}` : "bg-surface text-ink-mid"}`}
                style={{ boxShadow: "var(--shadow-card)" }}>
                {c.emoji} {c.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 pb-32 space-y-3">
        {isLoading ? <LoadingPlane text="载入中…" /> :
         displayed.length === 0 ? (
          <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-4xl mb-3">🗺️</div>
            <p className="font-bold text-ink text-sm">还没有心愿地点</p>
            <p className="text-xs text-ink-muted mt-1">点击 + 添加想去的地方吧</p>
          </div>
        ) : (
          displayed.map((item) => {
            const cat     = catInfo(item.category);
            const isConfirm = confirmDelete === item.id;
            return (
              <div key={item.id}
                   className={`rounded-3xl bg-surface overflow-hidden transition-all ${item.visited ? "opacity-60" : ""}`}
                   style={{ boxShadow: "var(--shadow-card)" }}>
                {/* Photo */}
                {item.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo} alt={item.name} className="w-full h-36 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Visit toggle */}
                    <button onClick={() => { item.visited ? tap() : success(); toggleItem.mutate(item.id); }}
                      className={`mt-0.5 h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        item.visited ? `${cat.bg} border-transparent` : "border-ink-faint"
                      }`}>
                      {item.visited && <Check className={`h-3.5 w-3.5 ${cat.text}`} strokeWidth={3} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${cat.bg} ${cat.text}`}>
                          {cat.emoji} {cat.label}
                        </span>
                        <span className="text-[10px] text-ink-faint flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" /> {item.location}
                        </span>
                      </div>
                      <p className={`font-bold text-sm mt-1 ${item.visited ? "line-through text-ink-faint" : "text-ink"}`}>
                        {item.name}
                      </p>
                      {item.notes && <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{item.notes}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          onClick={() => tap()}
                          className="h-7 w-7 rounded-xl bg-lavender-100 flex items-center justify-center">
                          <ExternalLink className="h-3.5 w-3.5 text-lavender" />
                        </a>
                      )}
                      {isConfirm ? (
                        <div className="flex gap-1">
                          <button onClick={() => { warn(); removeItem.mutate(item.id); setConfirmDelete(null); }}
                            className="text-[10px] font-bold bg-petal-100 text-petal-400 rounded-xl px-2 py-1">删除</button>
                          <button onClick={() => { tap(); setConfirmDelete(null); }}
                            className="text-[10px] font-bold bg-black/5 text-ink-muted rounded-xl px-2 py-1">取消</button>
                        </div>
                      ) : (
                        <button onClick={() => handleDelete(item.id)}
                          className="h-7 w-7 rounded-xl bg-black/5 flex items-center justify-center">
                          <X className="h-3.5 w-3.5 text-ink-muted" />
                        </button>
                      )}
                    </div>
                  </div>
                  {item.visited && (
                    <p className="text-[10px] text-sage-600 font-bold mt-2 ml-10">✓ 已打卡！</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button onClick={() => { tap(); setShowForm(true); }}
        className="fixed bottom-24 right-5 h-14 w-14 rounded-full text-white flex items-center justify-center z-30"
        style={{ background: "linear-gradient(135deg, #8B7AB8, #A090D0)", boxShadow: "0 6px 24px rgba(139,122,184,0.4)" }}>
        <Plus className="h-6 w-6" />
      </button>

      {/* ── Add item bottom sheet ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
             style={{ background: "rgba(0,0,0,0.35)" }}
             onClick={() => { resetForm(); setShowForm(false); }}>
          <div className="bg-cream rounded-t-4xl animate-slide-up flex flex-col"
               style={{ maxHeight: "90dvh" }}
               onClick={(e) => e.stopPropagation()}>
            {/* Handle */}
            <div className="px-6 pt-5 pb-3 shrink-0">
              <div className="w-10 h-1 rounded-full bg-ink-faint mx-auto mb-4" />
              <h3 className="text-lg font-bold text-ink">添加心愿地点</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-4">
              {/* Photo */}
              {fPhoto ? (
                <div className="relative rounded-2xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fPhoto} alt="preview" className="w-full h-40 object-cover" />
                  <button onClick={() => setFPhoto(null)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={() => { tap(); fileRef.current?.click(); }}
                  className="w-full rounded-2xl border-2 border-dashed border-ink-faint/30 bg-surface py-5 flex flex-col items-center gap-1.5"
                  style={{ boxShadow: "var(--shadow-card)" }}>
                  <ImagePlus className="h-7 w-7 text-ink-faint" />
                  <p className="text-xs font-semibold text-ink-muted">添加照片（选填）</p>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment"
                className="hidden" onChange={handlePhoto} />

              {/* Name */}
              <div>
                <label className="label">地点名称</label>
                <input className="input" placeholder="例：圣水洞 蓝瓶咖啡" value={fName}
                  onChange={(e) => setFName(e.target.value)} />
              </div>

              {/* Category */}
              <div>
                <label className="label">分类</label>
                <div className="flex flex-wrap gap-2">
                  {CATS.map((c) => (
                    <button key={c.key} type="button" onClick={() => { tap(); setFCat(c.key); }}
                      className={`flex items-center gap-1 text-xs font-bold rounded-2xl px-3 py-1.5 transition-all ${
                        fCat === c.key ? `${c.bg} ${c.text}` : "bg-surface text-ink-muted"
                      }`} style={{ boxShadow: "var(--shadow-card)" }}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="label">城市 / 区域</label>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((loc) => (
                    <button key={loc} type="button" onClick={() => { tap(); setFLocation(loc); }}
                      className={`text-xs font-bold rounded-2xl px-3 py-1.5 transition-all ${
                        fLocation === loc ? "bg-ink text-cream" : "bg-surface text-ink-mid"
                      }`} style={{ boxShadow: "var(--shadow-card)" }}>
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="label">链接（选填）</label>
                <input className="input" type="url" placeholder="https://..." value={fUrl}
                  onChange={(e) => setFUrl(e.target.value)} />
              </div>

              {/* Notes */}
              <div>
                <label className="label">备注（选填）</label>
                <textarea className="input resize-none text-sm" rows={2}
                  placeholder="推荐理由、开放时间…" value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)} />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => { resetForm(); setShowForm(false); }} className="btn-secondary flex-1">取消</button>
                <button onClick={handleSave} disabled={!fName.trim() || saving} className="btn-primary flex-1">
                  {saving ? "保存中…" : "添加"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
