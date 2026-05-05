"use client";

import { useState, useRef } from "react";
import { Plus, X, Check, ImagePlus, ExternalLink, MapPin } from "lucide-react";
import { usePrepare, useAddPrepareItem, useTogglePrepareItem, useRemovePrepareItem } from "@/lib/hooks/usePrepare";
import type { PrepareCategory } from "@/lib/hooks/usePrepare";
import { useWishlist, useAddWishlistItem, useToggleVisited, useRemoveWishlistItem } from "@/lib/hooks/useWishlist";
import type { WishlistCategory } from "@/lib/hooks/useWishlist";
import { useMembers } from "@/lib/hooks/useMembers";
import { LoadingPlane } from "@/components/ui/LoadingPlane";
import { tap, warn, success } from "@/lib/utils/haptics";

const TABS: { key: PrepareCategory; label: string; emoji: string; color: string; bg: string; solid: string }[] = [
  { key: "todo",     label: "待办", emoji: "✅", color: "text-sage-600",   bg: "bg-sage-100",   solid: "#5B8862" },
  { key: "packing",  label: "行李", emoji: "🧳", color: "text-ginger-500", bg: "bg-ginger-100", solid: "#E8A800" },
  { key: "wishlist", label: "想去", emoji: "❤️", color: "text-petal-400",  bg: "bg-petal-100",  solid: "#E87060" },
  { key: "shopping", label: "采购", emoji: "🛍️", color: "text-mist-400",   bg: "bg-mist-100",   solid: "#6BA3BE" },
];

const WISH_CATS: { key: WishlistCategory; label: string; emoji: string }[] = [
  { key: "cafe",       label: "咖啡", emoji: "☕" },
  { key: "food",       label: "美食", emoji: "🍜" },
  { key: "attraction", label: "景点", emoji: "🏯" },
  { key: "shopping",   label: "购物", emoji: "🛍️" },
  { key: "stay",       label: "住宿", emoji: "🏨" },
  { key: "other",      label: "其他", emoji: "📍" },
];
const LOCATIONS = ["首尔 Seoul", "釜山 Busan", "济州 Jeju", "仁川 Incheon", "其他"];

/* ── Wishlist tab content ── */
function WishlistTab() {
  const { data: items = [], isLoading } = useWishlist();
  const addItem    = useAddWishlistItem();
  const toggleItem = useToggleVisited();
  const removeItem = useRemoveWishlistItem();

  const fileRef                            = useRef<HTMLInputElement>(null);
  const [showForm,      setShowForm]       = useState(false);
  const [confirmDelete, setConfirmDelete]  = useState<string | null>(null);
  const [fName,         setFName]          = useState("");
  const [fCat,          setFCat]           = useState<WishlistCategory>("cafe");
  const [fLocation,     setFLocation]      = useState("首尔 Seoul");
  const [fUrl,          setFUrl]           = useState("");
  const [fNotes,        setFNotes]         = useState("");
  const [fPhoto,        setFPhoto]         = useState<string | null>(null);
  const [saving,        setSaving]         = useState(false);

  const visited     = items.filter((i) => i.visited).length;
  const pct         = items.length ? Math.round(visited / items.length * 100) : 0;

  function resetForm() { setFName(""); setFCat("cafe"); setFLocation("首尔 Seoul"); setFUrl(""); setFNotes(""); setFPhoto(null); }

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
      await addItem.mutateAsync({ name: fName.trim(), category: fCat, location: fLocation,
        url: fUrl.trim() || undefined, notes: fNotes.trim() || undefined, photo: fPhoto ?? undefined });
      success();
      resetForm(); setShowForm(false);
    } finally { setSaving(false); }
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) { warn(); removeItem.mutate(id); setConfirmDelete(null); }
    else { tap(); setConfirmDelete(id); }
  }

  const catOf = (key: WishlistCategory) => WISH_CATS.find((c) => c.key === key)!;

  return (
    <div className="space-y-2.5">
      {/* Progress */}
      {items.length > 0 && (
        <div className="rounded-3xl bg-surface px-4 py-3 flex items-center gap-3"
             style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-ink-muted">{visited}/{items.length} 个地方已打卡</span>
              <span className="text-xs font-bold text-petal-400">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${pct}%`, background: "#E87060" }} />
            </div>
          </div>
          {/* Mini ring */}
          <svg className="-rotate-90 shrink-0" width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="#E87060" strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`}
              strokeLinecap="round" />
          </svg>
        </div>
      )}

      {isLoading ? <LoadingPlane text="载入中…" /> :
       items.length === 0 ? (
        <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="text-4xl mb-3">🗺️</div>
          <p className="font-bold text-ink text-sm">还没有心愿地点</p>
          <p className="text-xs text-ink-muted mt-1">点击下方 + 添加想去的地方</p>
        </div>
      ) : (
        items.map((item) => {
          const cat       = catOf(item.category);
          const isConfirm = confirmDelete === item.id;
          return (
            <div key={item.id}
                 className={`rounded-3xl bg-surface overflow-hidden transition-all ${item.visited ? "opacity-60" : ""}`}
                 style={{ boxShadow: "var(--shadow-card)" }}>
              {item.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photo} alt={item.name} className="w-full h-32 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Visit toggle */}
                  <button onClick={() => { item.visited ? tap() : success(); toggleItem.mutate(item.id); }}
                    className={`mt-0.5 h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      item.visited ? "bg-petal-100 border-transparent" : "border-ink-faint"
                    }`}>
                    {item.visited && <Check className="h-3.5 w-3.5 text-petal-400" strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-petal-100 text-petal-400">
                        {cat.emoji} {cat.label}
                      </span>
                      <span className="text-[10px] text-ink-faint flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" /> {item.location}
                      </span>
                    </div>
                    <p className={`font-bold text-sm ${item.visited ? "line-through text-ink-faint" : "text-ink"}`}>
                      {item.name}
                    </p>
                    {item.notes && <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{item.notes}</p>}
                    {item.visited && <p className="text-[10px] text-sage-600 font-bold mt-1">✓ 已打卡！</p>}
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={() => tap()}
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
              </div>
            </div>
          );
        })
      )}

      {/* ── Add form bottom sheet ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
             style={{ background: "rgba(0,0,0,0.35)" }}
             onClick={() => { resetForm(); setShowForm(false); }}>
          <div className="bg-cream rounded-t-4xl animate-slide-up flex flex-col"
               style={{ maxHeight: "90dvh" }}
               onClick={(e) => e.stopPropagation()}>
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
                  className="w-full rounded-2xl border-2 border-dashed border-ink-faint/30 bg-surface py-5 flex flex-col items-center gap-1.5">
                  <ImagePlus className="h-7 w-7 text-ink-faint" />
                  <p className="text-xs font-semibold text-ink-muted">添加照片（选填）</p>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment"
                className="hidden" onChange={handlePhoto} />

              <div>
                <label className="label">地点名称</label>
                <input className="input" placeholder="例：圣水洞 蓝瓶咖啡" value={fName}
                  onChange={(e) => setFName(e.target.value)} />
              </div>

              <div>
                <label className="label">分类</label>
                <div className="flex flex-wrap gap-2">
                  {WISH_CATS.map((c) => (
                    <button key={c.key} type="button" onClick={() => { tap(); setFCat(c.key); }}
                      className={`flex items-center gap-1 text-xs font-bold rounded-2xl px-3 py-1.5 transition-all ${
                        fCat === c.key ? "bg-petal-100 text-petal-400" : "bg-surface text-ink-muted"
                      }`} style={{ boxShadow: "var(--shadow-card)" }}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

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

              <div>
                <label className="label">链接（选填）</label>
                <input className="input" type="url" placeholder="https://..." value={fUrl}
                  onChange={(e) => setFUrl(e.target.value)} />
              </div>

              <div>
                <label className="label">备注（选填）</label>
                <textarea className="input resize-none text-sm" rows={2}
                  placeholder="推荐理由、开放时间…" value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)} />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => { resetForm(); setShowForm(false); }} className="btn-secondary flex-1">取消</button>
                <button onClick={handleSave} disabled={!fName.trim() || saving}
                  className="flex-1 py-3 rounded-2xl font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: "#E87060" }}>
                  {saving ? "保存中…" : "添加"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB inside wishlist tab */}
      <button onClick={() => { tap(); setShowForm(true); }}
        className="fixed bottom-24 right-5 h-14 w-14 rounded-full text-white flex items-center justify-center z-30"
        style={{ background: "linear-gradient(135deg, #E87060, #EE9080)", boxShadow: "0 6px 24px rgba(232,112,96,0.35)" }}>
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

/* ── Main page ── */
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
    if (confirmDelete === id) { warn(); removeItem.mutate(id); setConfirmDelete(null); }
    else { tap(); setConfirmDelete(id); }
  }

  const isWishlist = activeTab === "wishlist";

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* Header */}
      <div className="px-5 pt-safe pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-ink tracking-tight">行前准备</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              {isWishlist ? "打卡心愿地点 ❤️" : "出发前要做的事 ✨"}
            </p>
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

      {/* Tab bar */}
      <div className="px-4 pt-2 pb-2">
        <div className="tab-bar">
          {TABS.map((t) => {
            const isActive = activeTab === t.key;
            const pending  = t.key === "wishlist"
              ? 0  // wishlist shows its own progress
              : items.filter((i) => i.category === t.key && !i.done).length;
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

      {/* Wishlist tab: delegate to dedicated component */}
      {isWishlist ? (
        <div className="flex-1 px-4 pb-32">
          <WishlistTab />
        </div>
      ) : (
        <>
          {/* Member filter */}
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
                  const isConfirm   = confirmDelete === item.id;
                  const itemMembers = members.filter((m) => (item.assignees ?? []).includes(m.id));
                  return (
                    <div key={item.id}
                         className={`rounded-3xl bg-surface p-4 flex items-start gap-3 transition-all ${item.done ? "opacity-60" : ""}`}
                         style={{ boxShadow: "var(--shadow-card)" }}>
                      <button onClick={() => { tap(); toggleItem.mutate(item.id); }}
                        className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          item.done ? `${tab.bg} border-transparent` : "border-ink-faint"
                        }`}>
                        {item.done && <Check className={`h-3.5 w-3.5 ${tab.color}`} strokeWidth={3} />}
                      </button>

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

                      {isConfirm ? (
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          <button onClick={() => { warn(); removeItem.mutate(item.id); setConfirmDelete(null); }}
                            className="text-[10px] font-bold bg-petal-100 text-petal-400 rounded-xl px-2.5 py-1.5">确认删除</button>
                          <button onClick={() => { tap(); setConfirmDelete(null); }}
                            className="text-[10px] font-bold bg-black/5 text-ink-muted rounded-xl px-2.5 py-1.5">取消</button>
                        </div>
                      ) : (
                        <button onClick={() => handleDeleteClick(item.id)}
                          className="mt-0.5 shrink-0 h-7 w-7 rounded-full bg-black/5 flex items-center justify-center">
                          <X className="h-3.5 w-3.5 text-ink-muted" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* Inline add input */}
            {showInput && (
              <div className="rounded-3xl bg-surface p-4 space-y-3 animate-slide-up"
                   style={{ boxShadow: "var(--shadow-card)" }}>
                <input autoFocus
                  className="w-full bg-transparent text-sm text-ink placeholder-ink-faint outline-none font-medium"
                  placeholder={`添加${tab.label}项目…`}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                    if (e.key === "Escape") { setShowInput(false); setNewText(""); }
                  }}
                />
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

          {/* FAB — only for non-wishlist tabs */}
          {!showInput && (
            <button onClick={() => { tap(); setShowInput(true); }}
              className="fixed bottom-24 right-5 h-14 w-14 rounded-full bg-sage text-white flex items-center justify-center z-30"
              style={{ boxShadow: "0 6px 24px rgba(91,136,98,0.35)" }}>
              <Plus className="h-6 w-6" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
