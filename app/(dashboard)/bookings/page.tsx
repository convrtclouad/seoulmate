"use client";

import { useState } from "react";
import { Plus, Plane, Hotel, Car, Ticket, X } from "lucide-react";
import { useBookings, useAddBooking, useRemoveBooking } from "@/lib/hooks/useSupabaseBookings";
import type { BookingType, Booking } from "@/lib/hooks/useSupabaseBookings";
import { useMembers } from "@/lib/hooks/useSupabaseMembers";
import { LoadingPlane } from "@/components/ui/LoadingPlane";

const TABS: { key: BookingType; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: "flight",  label: "机票", icon: Plane,  color: "text-sage-600",   bg: "bg-sage-100"   },
  { key: "hotel",   label: "住宿", icon: Hotel,  color: "text-lavender",   bg: "bg-lavender-100" },
  { key: "rental",  label: "租车", icon: Car,    color: "text-ginger-500", bg: "bg-ginger-100" },
  { key: "voucher", label: "票券", icon: Ticket, color: "text-petal-400",  bg: "bg-petal-100"  },
];

/* ── Fixed KLIA→ICN flight (editable details) ── */
const LS_FLIGHT_KEY = "seoulmate_d7505_details";

interface FlightDetails {
  depTime: string;
  arrTime: string;
  baggage: string;
  seat: string;
  notes: string;
}

function loadFlightDetails(): FlightDetails {
  if (typeof window === "undefined") return { depTime: "", arrTime: "", baggage: "25kg", seat: "", notes: "" };
  try {
    return JSON.parse(localStorage.getItem(LS_FLIGHT_KEY) ?? "null") ?? { depTime: "", arrTime: "", baggage: "25kg", seat: "", notes: "" };
  } catch { return { depTime: "", arrTime: "", baggage: "25kg", seat: "", notes: "" }; }
}

function FixedFlightCard() {
  const [details, setDetails] = useState<FlightDetails>(loadFlightDetails());
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState<FlightDetails>(details);

  function openEdit() { setDraft(details); setEditing(true); }
  function saveEdit() {
    setDetails(draft);
    localStorage.setItem(LS_FLIGHT_KEY, JSON.stringify(draft));
    setEditing(false);
  }

  return (
    <>
      <div className="rounded-3xl overflow-hidden" style={{ boxShadow: "0 8px 28px rgba(255,0,96,0.13)" }}>
        {/* Airline header */}
        <div style={{ background: "linear-gradient(135deg, #FF0060, #FF4D94)" }}
             className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-lg font-black tracking-tight">airasia</span>
            <span className="text-white/60 text-xs font-semibold">X</span>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Flight</p>
            <p className="text-white font-black text-base tracking-widest">D7 505</p>
          </div>
        </div>

        {/* Route */}
        <div className="bg-white px-5 py-5">
          <div className="flex items-center gap-3">
            {/* Departure */}
            <div className="flex-1">
              <p className="text-3xl font-black text-ink">KUL</p>
              <p className="text-xs text-ink-muted mt-1 font-semibold">KLIA · 吉隆坡</p>
              {details.depTime && (
                <p className="text-base font-black text-ink mt-1">{details.depTime}</p>
              )}
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-petal-400" />
                <p className="text-[10px] text-petal-400 font-bold">出发</p>
              </div>
            </div>

            {/* Centre */}
            <div className="flex flex-col items-center gap-1.5 px-1">
              <p className="text-[10px] text-ink-faint font-semibold">2026 / 05 / 07</p>
              <div className="flex items-center gap-1 w-full">
                <div className="flex-1 h-px bg-ink-faint/40" />
                <div className="h-7 w-7 rounded-full bg-petal-50 flex items-center justify-center">
                  <Plane className="h-4 w-4 text-petal-400 -rotate-45" />
                </div>
                <div className="flex-1 h-px bg-ink-faint/40" />
              </div>
              <p className="text-[10px] text-ink-faint">约 6h 30m</p>
            </div>

            {/* Arrival */}
            <div className="flex-1 text-right">
              <p className="text-3xl font-black text-ink">ICN</p>
              <p className="text-xs text-ink-muted mt-1 font-semibold">仁川 · 首尔</p>
              {details.arrTime && (
                <p className="text-base font-black text-ink mt-1">{details.arrTime}</p>
              )}
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-sage-50 px-2 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-sage" />
                <p className="text-[10px] text-sage-600 font-bold">到达</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="mt-4 pt-4 border-t border-black/5 grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-[9px] text-ink-faint font-semibold uppercase tracking-wide">航空</p>
              <p className="text-xs font-bold text-ink mt-0.5">AirAsia X</p>
            </div>
            <div>
              <p className="text-[9px] text-ink-faint font-semibold uppercase tracking-wide">行李</p>
              <p className="text-xs font-bold text-ink mt-0.5">🧳 {details.baggage}</p>
            </div>
            <div>
              <p className="text-[9px] text-ink-faint font-semibold uppercase tracking-wide">座位</p>
              <p className="text-xs font-bold text-ink mt-0.5">{details.seat || "—"}</p>
            </div>
            <div>
              <p className="text-[9px] text-ink-faint font-semibold uppercase tracking-wide">航班</p>
              <p className="text-xs font-bold text-ink mt-0.5">D7 505</p>
            </div>
          </div>

          {details.notes && (
            <p className="mt-3 text-xs text-ink-muted bg-black/3 rounded-2xl px-3 py-2">{details.notes}</p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-red-50 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs">📱</span>
            <p className="text-[11px] text-petal-400 font-semibold">提前 3 小时到达 KLIA，网上值机更快</p>
          </div>
          <button onClick={openEdit}
            className="shrink-0 ml-2 bg-white text-petal-400 text-[11px] font-bold rounded-2xl px-3 py-1.5 border border-petal-100">
            ✏️ 编辑
          </button>
        </div>
      </div>

      {/* Edit sheet */}
      {editing && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.3)" }}
             onClick={() => setEditing(false)}>
          <div className="bg-cream rounded-t-4xl p-6 pb-10 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-ink-faint mx-auto mb-5" />
            <h3 className="text-lg font-bold text-ink mb-4">编辑航班信息</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">出发时间</label>
                  <input className="input" placeholder="例：23:55" value={draft.depTime}
                    onChange={(e) => setDraft(d => ({ ...d, depTime: e.target.value }))} />
                </div>
                <div>
                  <label className="label">到达时间</label>
                  <input className="input" placeholder="例：07:30+1" value={draft.arrTime}
                    onChange={(e) => setDraft(d => ({ ...d, arrTime: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">行李额度</label>
                  <input className="input" placeholder="例：25kg" value={draft.baggage}
                    onChange={(e) => setDraft(d => ({ ...d, baggage: e.target.value }))} />
                </div>
                <div>
                  <label className="label">座位号</label>
                  <input className="input" placeholder="例：15A" value={draft.seat}
                    onChange={(e) => setDraft(d => ({ ...d, seat: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">备注</label>
                <input className="input" placeholder="任何附加信息…" value={draft.notes}
                  onChange={(e) => setDraft(d => ({ ...d, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditing(false)} className="btn-secondary flex-1">取消</button>
                <button onClick={saveEdit} className="btn-primary flex-1">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UserFlightCard({ b, onDelete }: { b: Booking; onDelete: () => void }) {
  return (
    <div className="rounded-3xl bg-surface overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="bg-gradient-to-r from-sage-400 to-sage-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-white/80" />
          <span className="text-white text-xs font-bold">{b.airline ?? "航空公司"}</span>
        </div>
        <span className="text-white text-xs font-mono">{b.flight_no}</span>
        <button onClick={onDelete} className="text-white/60 hover:text-white p-1 rounded-xl transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-5 py-4 flex items-center gap-3">
        <div className="text-center">
          <p className="text-2xl font-black text-ink">{b.departure_code ?? "—"}</p>
          <p className="text-xs text-ink-muted mt-0.5">{b.departure_time ?? "--:--"}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 w-full">
            <div className="flex-1 h-px bg-ink-faint" />
            <Plane className="h-4 w-4 text-sage" />
            <div className="flex-1 h-px bg-ink-faint" />
          </div>
          {b.travel_date && <p className="text-[10px] text-ink-faint">{b.travel_date}</p>}
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-ink">{b.arrival_code ?? "—"}</p>
          <p className="text-xs text-ink-muted mt-0.5">{b.arrival_time ?? "--:--"}</p>
        </div>
      </div>
      {b.price && (
        <div className="px-5 pb-4 flex items-center justify-between">
          <span className="text-xs text-ink-muted">票价</span>
          <span className="text-sm font-bold text-ink">{b.currency ?? ""} {b.price}</span>
        </div>
      )}
    </div>
  );
}

function GenericCard({ b, tab, onDelete }: { b: Booking; tab: typeof TABS[0]; onDelete: () => void }) {
  const Icon = tab.icon;
  return (
    <div className="rounded-3xl bg-surface p-4 flex items-center gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={`h-11 w-11 rounded-2xl ${tab.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${tab.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-ink text-sm">{b.title}</p>
        {(b.check_in || b.travel_date) && (
          <p className="text-xs text-ink-muted mt-0.5">{b.check_in ?? b.travel_date}{b.check_out ? ` → ${b.check_out}` : ""}</p>
        )}
        {b.price && <p className="text-xs text-ink-muted">{b.currency} {b.price}</p>}
      </div>
      <button onClick={onDelete} className="text-ink-faint hover:text-petal-400 p-1 rounded-xl transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function BookingsPage() {
  const { data: bookings = [], isLoading } = useBookings();
  const { data: members = [] }             = useMembers();
  const addBooking    = useAddBooking();
  const removeBooking = useRemoveBooking();

  const [activeTab, setActiveTab] = useState<BookingType>("flight");
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<Partial<Omit<Booking,"id"|"created_at">>>({ type: "flight" });

  const tab      = TABS.find((t) => t.key === activeTab)!;
  const filtered = bookings.filter((b) => b.type === activeTab);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await addBooking.mutateAsync({ ...form, type: activeTab, title: form.title ?? "" } as Omit<Booking,"id"|"created_at">);
    setForm({ type: activeTab }); setShowForm(false);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
      {/* Header */}
      <div className="px-5 pt-safe pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-ink tracking-tight">预订详情</h1>
            <p className="text-xs text-ink-muted mt-0.5">机票、住宿和票券 🎫</p>
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
      <div className="px-4 pt-2 pb-4">
        <div className="tab-bar">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={isActive ? "tab-item-active" : "tab-item-inactive"}>
                <Icon className={`h-4 w-4 ${isActive ? t.color : "text-ink-faint"}`} />
                <span className="text-xs font-bold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-safe space-y-3">
        {isLoading ? (
          <LoadingPlane text="载入预订信息…" />
        ) : activeTab === "flight" ? (
          /* Always show fixed flight first, then user-added ones */
          <>
            <FixedFlightCard />
            {filtered.map((b) => (
              <UserFlightCard key={b.id} b={b} onDelete={() => removeBooking.mutate(b.id)} />
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <tab.icon className={`h-10 w-10 mx-auto mb-3 ${tab.color} opacity-40`} />
            <p className="font-bold text-ink text-sm">还没有{tab.label}信息</p>
            <p className="text-xs text-ink-muted mt-1">点击下方 + 添加预订</p>
          </div>
        ) : (
          filtered.map((b) => (
            <GenericCard key={b.id} b={b} tab={tab} onDelete={() => removeBooking.mutate(b.id)} />
          ))
        )}
      </div>

      {/* FAB – hide for flights since fixed card is always there; show for hotel/rental/voucher */}
      {activeTab !== "flight" && (
        <button onClick={() => { setForm({ type: activeTab }); setShowForm(true); }}
          className="fixed bottom-24 right-5 h-14 w-14 rounded-full bg-ginger flex items-center justify-center z-30 text-white"
          style={{ boxShadow: "0 6px 24px rgba(232,168,0,0.35)" }}>
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Add sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
             style={{ background: "rgba(0,0,0,0.3)" }}
             onClick={() => setShowForm(false)}>
          <div className="bg-cream rounded-t-4xl p-6 pb-10 max-h-[85vh] overflow-y-auto animate-slide-up"
               onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-ink-faint mx-auto mb-5" />
            <h3 className="text-lg font-bold text-ink mb-4">添加{tab.label}</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label">名称</label>
                <input className="input" placeholder={activeTab === "hotel" ? "例：首尔明洞酒店" : "名称"} required
                  value={form.title ?? ""} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              {activeTab === "hotel" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">入住日期</label>
                    <input className="input" type="date" value={form.check_in ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, check_in: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">退房日期</label>
                    <input className="input" type="date" value={form.check_out ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, check_out: e.target.value }))} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">价格</label>
                  <input className="input" placeholder="0" type="number" value={form.price ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="label">币种</label>
                  <input className="input" placeholder="MYR" value={form.currency ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">取消</button>
                <button type="submit" className="btn-primary flex-1">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
