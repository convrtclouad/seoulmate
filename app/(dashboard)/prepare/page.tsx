"use client";

import { useState, useRef } from "react";
import { Plus, X, Check, ImagePlus, ExternalLink, MapPin } from "lucide-react";
import { usePrepare, useAddPrepareItem, useTogglePrepareItem, useRemovePrepareItem } from "@/lib/hooks/useSupabasePrepare";
import type { PrepareCategory, PrepareItem } from "@/lib/hooks/useSupabasePrepare";
import { useWishlist, useAddWishlistItem, useToggleVisited, useRemoveWishlistItem } from "@/lib/hooks/useSupabaseWishlist";
import type { WishlistCategory } from "@/lib/hooks/useSupabaseWishlist";
import { useMembers } from "@/lib/hooks/useSupabaseMembers";
import type { Member } from "@/lib/hooks/useSupabaseMembers";
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

/* ── Per-member grouped item card ── */
function GroupedItemCard({
  text, groupItems, members, tab, onToggle, onDeleteAll,
}: {
  text: string;
  groupItems: PrepareItem[];
  members: Member[];
  tab: typeof TABS[0];
  onToggle: (id: string, done: boolean) => void;
  onDeleteAll: (ids: string[]) => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const isTemplate = groupItems.every(i => i.id.startsWith("ptpl-"));
  const allDone    = groupItems.every(i => i.done);
  const doneCnt    = groupItems.filter(i => i.done).length;

  // Map member → their copy of this item
  const memberMap: Record<string, PrepareItem | undefined> = {};
  for (const item of groupItems) {
    if (item.assignees?.length === 1) {
      memberMap[item.assignees[0]] = item;
    } else if (!item.assignees?.length) {
      // shared item — assign to first "slot"
      members.forEach(m => { if (!memberMap[m.id]) memberMap[m.id] = item; });
    }
  }

  // Which members are represented in this group?
  const relevantMembers = members.filter(m => memberMap[m.id]);
  const sharedItem = groupItems.find(i => !i.assignees?.length);

  return (
    <div className={`rounded-3xl bg-surface p-4 transition-all ${allDone ? "opacity-60" : ""}`}
         style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className={`text-sm font-semibold leading-snug flex-1 ${allDone ? "line-through text-ink-faint" : "text-ink"}`}>
          {text}
        </p>
        {!isTemplate && (
          confirmDel ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => { warn(); onDeleteAll(groupItems.map(i => i.id)); }}
                className="text-[10px] font-bold bg-petal-100 text-petal-400 rounded-xl px-2.5 py-1">确认删除</button>
              <button onClick={() => setConfirmDel(false)}
                className="text-[10px] font-bold bg-black/5 text-ink-muted rounded-xl px-2.5 py-1">取消</button>
            </div>
          ) : (
            <button onClick={() => { tap(); setConfirmDel(true); }}
              className="shrink-0 h-6 w-6 rounded-full bg-black/5 flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-ink-muted" />
            </button>
          )
        )}
      </div>

      {/* Per-member chips */}
      {sharedItem ? (
        // Shared item — single checkbox
        <button
          onClick={() => { tap(); onToggle(sharedItem.id, sharedItem.done); }}
          className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-bold transition-all ${
            sharedItem.done ? "bg-emerald-500 text-white" : `${tab.bg} ${tab.color}`
          }`}>
          {sharedItem.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-3.5 w-3.5 rounded-full border-2 border-current inline-block" />}
          全员
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {relevantMembers.map(member => {
            const item = memberMap[member.id]!;
            return (
              <button key={member.id}
                onClick={() => { tap(); onToggle(item.id, item.done); }}
                className={`flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                  item.done ? "bg-emerald-500 text-white" : `${tab.bg} ${tab.color}`
                }`}>
                <span>{member.emoji}</span>
                <span>{member.name}</span>
                {item.done && <Check className="h-3 w-3" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}

      {/* Progress indicator */}
      {relevantMembers.length > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${(doneCnt / relevantMembers.length) * 100}%`, background: allDone ? "#10b981" : tab.solid }} />
          </div>
          <span className="text-[10px] text-ink-faint font-semibold shrink-0">{doneCnt}/{relevantMembers.length}</span>
        </div>
      )}
    </div>
  );
}

/* ── Wishlist tab ── */
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

  const visited = items.filter((i) => i.visited).length;
  const pct     = items.length ? Math.round(visited / items.length * 100) : 0;

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
        url: fUrl.trim() || null, notes: fNotes.trim() || null, photo: fPhoto ?? null });
      success(); resetForm(); setShowForm(false);
    } finally { setSaving(false); }
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) { warn(); removeItem.mutate(id); setConfirmDelete(null); }
    else { tap(); setConfirmDelete(id); }
  }

  const catOf = (key: WishlistCategory) => WISH_CATS.find((c) => c.key === key)!;

  return (
    <div className="space-y-2.5">
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
                  <button onClick={() => { item.visited ? tap() : success(); toggleItem.mutate({ id: item.id, visited: item.visited }); }}
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
      <button onClick={() => { tap(); setShowForm(true); }}
        className="fixed bottom-32 right-5 h-14 w-14 rounded-full text-white flex items-center justify-center z-30"
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

  const [activeTab,    setActiveTab]    = useState<PrepareCategory>("todo");
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const [showInput,    setShowInput]    = useState(false);
  const [newText,      setNewText]      = useState("");
  const [newAssignees, setNewAssignees] = useState<string[]>([]);

  const tab      = TABS.find((t) => t.key === activeTab)!;
  const tabItems = items.filter((i) => i.category === activeTab);

  // When filtering by member, show only their items; else show all
  const filtered = filterMember
    ? tabItems.filter(i => (i.assignees ?? []).includes(filterMember) || !(i.assignees ?? []).length)
    : tabItems;

  // Group by text for the grouped card view
  const grouped: Record<string, PrepareItem[]> = {};
  for (const item of filtered) {
    if (!grouped[item.text]) grouped[item.text] = [];
    grouped[item.text].push(item);
  }
  const groupEntries = Object.entries(grouped);

  // Progress counts (unique texts done = all members done for that text)
  const totalGroups = groupEntries.length;
  const doneGroups  = groupEntries.filter(([, g]) => g.every(i => i.done)).length;

  function toggleAssignee(id: string) {
    tap();
    setNewAssignees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleAdd() {
    if (!newText.trim()) return;
    tap();
    // If members selected, create one item per member; else create shared item
    if (newAssignees.length > 0) {
      for (const memberId of newAssignees) {
        await addItem.mutateAsync({ category: activeTab, text: newText.trim(), assignees: [memberId] });
      }
    } else {
      await addItem.mutateAsync({ category: activeTab, text: newText.trim(), assignees: [] });
    }
    setNewText(""); setNewAssignees([]); setShowInput(false);
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
              ? 0
              : (() => {
                  const tItems = items.filter(i => i.category === t.key);
                  const tGrouped: Record<string, PrepareItem[]> = {};
                  for (const item of tItems) {
                    if (!tGrouped[item.text]) tGrouped[item.text] = [];
                    tGrouped[item.text].push(item);
                  }
                  return Object.values(tGrouped).filter(g => !g.every(i => i.done)).length;
                })();
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
                      <span>{m.emoji}</span><span>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overall progress */}
          {totalGroups > 0 && (
            <div className="px-4 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-ink-muted font-medium">{doneGroups}/{totalGroups} 项完成</span>
                <span className={`text-xs font-bold ${tab.color}`}>
                  {Math.round(doneGroups / totalGroups * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                     style={{ width: `${totalGroups ? (doneGroups / totalGroups * 100) : 0}%`, background: tab.solid }} />
              </div>
            </div>
          )}

          {/* Grouped items */}
          <div className="flex-1 px-4 pb-32 space-y-2.5">
            {isLoading ? (
              <LoadingPlane text="载入中…" />
            ) : groupEntries.length === 0 && !showInput ? (
              <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="text-4xl mb-3">{tab.emoji}</div>
                <p className="font-bold text-ink text-sm">{tab.label}清单是空的</p>
                <p className="text-xs text-ink-muted mt-1">点击下方 + 开始添加</p>
              </div>
            ) : (
              <>
                {groupEntries.map(([text, groupItems]) => (
                  <GroupedItemCard
                    key={text}
                    text={text}
                    groupItems={groupItems}
                    members={filterMember ? members.filter(m => m.id === filterMember) : members}
                    tab={tab}
                    onToggle={(id, done) => { tap(); toggleItem.mutate({ id, done }); }}
                    onDeleteAll={(ids) => ids.forEach(id => removeItem.mutate(id))}
                  />
                ))}
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
                    <p className="text-[10px] font-bold text-ink-faint mb-2 uppercase tracking-wider">
                      指定成员（不选 = 全员共享）
                    </p>
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

          {!showInput && (
            <button onClick={() => { tap(); setShowInput(true); }}
              className="fixed bottom-32 right-5 h-14 w-14 rounded-full bg-sage text-white flex items-center justify-center z-30"
              style={{ boxShadow: "0 6px 24px rgba(91,136,98,0.35)" }}>
              <Plus className="h-6 w-6" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
