"use client";

import { useState } from "react";
import { Plus, Plane, Hotel, Car, Ticket, X, ChevronRight } from "lucide-react";
import { useBookings, useAddBooking, useRemoveBooking } from "@/lib/hooks/useBookings";
import type { BookingType, Booking } from "@/lib/hooks/useBookings";
import { useMembers } from "@/lib/hooks/useMembers";
import { LoadingPlane } from "@/components/ui/LoadingPlane";

const TABS: { key: BookingType; label: string; icon: React.ElementType; color: string; bg: string; grad: string }[] = [
  { key: "flight",  label: "机票", icon: Plane,  color: "text-sage-600",   bg: "bg-sage-100",   grad: "from-sage-400 to-sage-600" },
  { key: "hotel",   label: "住宿", icon: Hotel,  color: "text-lavender",   bg: "bg-lavender-100", grad: "from-lavender-300 to-lavender" },
  { key: "rental",  label: "租车", icon: Car,    color: "text-ginger-500", bg: "bg-ginger-100", grad: "from-ginger-300 to-ginger-500" },
  { key: "voucher", label: "票券", icon: Ticket, color: "text-petal-400",  bg: "bg-petal-100",  grad: "from-petal-300 to-petal-400" },
];

function FlightCard({ b, onDelete }: { b: Booking; onDelete: () => void }) {
  return (
    <div className="rounded-3xl bg-surface overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      {/* Header */}
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
      {/* Route */}
      <div className="px-5 py-4 flex items-center gap-3">
        <div className="text-center">
          <p className="text-2xl font-black text-ink">{b.departure_code ?? "—"}</p>
          <p className="text-xs text-ink-muted mt-0.5">{b.departure_time ?? "--:--"}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 w-full">
            <div className="flex-1 h-px bg-ink-faint" />
            <Plane className="h-4 w-4 text-sage rotate-90" />
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
          <p className="text-xs text-ink-muted mt-0.5">{b.check_in ?? b.travel_date} {b.check_out ? `→ ${b.check_out}` : ""}</p>
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
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-4xl mb-3">{<tab.icon />}</div>
            <p className="font-bold text-ink text-sm">还没有{tab.label}信息</p>
            <p className="text-xs text-ink-muted mt-1">点击下方 + 添加预订</p>
          </div>
        ) : (
          filtered.map((b) =>
            b.type === "flight"
              ? <FlightCard key={b.id} b={b} onDelete={() => removeBooking.mutate(b.id)} />
              : <GenericCard key={b.id} b={b} tab={tab} onDelete={() => removeBooking.mutate(b.id)} />
          )
        )}
      </div>

      {/* FAB */}
      <button onClick={() => { setForm({ type: activeTab }); setShowForm(true); }}
        className="fixed bottom-24 right-5 h-14 w-14 rounded-full bg-ginger flex items-center justify-center z-30 text-white"
        style={{ boxShadow: "0 6px 24px rgba(232,168,0,0.35)" }}>
        <Plus className="h-6 w-6" />
      </button>

      {/* Add sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.3)" }}
             onClick={() => setShowForm(false)}>
          <div className="bg-cream rounded-t-4xl p-6 pb-10 max-h-[85vh] overflow-y-auto animate-slide-up"
               onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-ink-faint mx-auto mb-5" />
            <h3 className="text-lg font-bold text-ink mb-4">添加{tab.label}</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="label">名称/航班号</label>
                <input className="input" placeholder={activeTab === "flight" ? "例：BX 796" : "例：首尔明洞酒店"} required
                  value={form.title ?? ""} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              {activeTab === "flight" && (<>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">出发机场</label>
                    <input className="input" placeholder="KHH" maxLength={3}
                      value={form.departure_code ?? ""} onChange={(e) => setForm(f => ({ ...f, departure_code: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <label className="label">到达机场</label>
                    <input className="input" placeholder="ICN" maxLength={3}
                      value={form.arrival_code ?? ""} onChange={(e) => setForm(f => ({ ...f, arrival_code: e.target.value.toUpperCase() }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">出发时间</label>
                    <input className="input" placeholder="10:30" value={form.departure_time ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, departure_time: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">到达时间</label>
                    <input className="input" placeholder="14:30" value={form.arrival_time ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, arrival_time: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="label">航空公司</label>
                  <input className="input" placeholder="例：釜山航空" value={form.airline ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, airline: e.target.value }))} />
                </div>
                <div>
                  <label className="label">出发日期</label>
                  <input className="input" type="date" value={form.travel_date ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, travel_date: e.target.value }))} />
                </div>
              </>)}
              {activeTab === "hotel" && (<>
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
              </>)}
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
