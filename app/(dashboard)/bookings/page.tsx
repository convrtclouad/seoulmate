"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Plane, Hotel, Car, Ticket, X } from "lucide-react";
import { useBookings, useAddBooking, useRemoveBooking } from "@/lib/hooks/useSupabaseBookings";
import type { BookingType, Booking } from "@/lib/hooks/useSupabaseBookings";
import { useMembers } from "@/lib/hooks/useSupabaseMembers";
import { getSupabaseClient, hasSupabase } from "@/lib/supabase/client";
import { LoadingPlane } from "@/components/ui/LoadingPlane";

const TRIP_ID = process.env.NEXT_PUBLIC_TRIP_ID ?? "demo-trip";

const TABS: { key: BookingType; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: "flight",  label: "机票", icon: Plane,  color: "text-sage-600",   bg: "bg-sage-100"   },
  { key: "hotel",   label: "住宿", icon: Hotel,  color: "text-lavender",   bg: "bg-lavender-100" },
  { key: "rental",  label: "租车", icon: Car,    color: "text-ginger-500", bg: "bg-ginger-100" },
  { key: "voucher", label: "票券", icon: Ticket, color: "text-petal-400",  bg: "bg-petal-100"  },
];

interface FlightDetails {
  depTime: string;
  arrTime: string;
  baggage: string;
  seat:    string;
  notes:   string;
}
const DEFAULT_DETAILS: FlightDetails = { depTime: "", arrTime: "", baggage: "20kg", seat: "", notes: "" };
const OUTBOUND_DEFAULTS: FlightDetails = { depTime: "23:30", arrTime: "07:00 (+1)", baggage: "20kg", seat: "", notes: "KLIA2 · AirAsia X" };
const RETURN_DEFAULTS:   FlightDetails = { depTime: "08:15", arrTime: "13:45",      baggage: "20kg", seat: "", notes: "PNR: KK3YTR · ICN T2" };

/* ── Supabase-backed flight slot hook ── */
function useFlightSlot(slotId: string, slotDefault: FlightDetails = DEFAULT_DETAILS) {
  const qc   = useQueryClient();
  const sb   = getSupabaseClient();
  const dbId = `${TRIP_ID}__${slotId}`;
  const qKey = ["flight_slot", dbId];

  const query = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      if (!hasSupabase()) {
        try { return JSON.parse(localStorage.getItem(`seoulmate_${slotId}`) ?? "null") ?? slotDefault; }
        catch { return slotDefault; }
      }
      const { data } = await sb.from("bookings").select("data").eq("id", dbId).maybeSingle();
      return (data?.data as FlightDetails) ?? slotDefault;
    },
    staleTime: Infinity,
  });

  const save = useMutation({
    mutationFn: async (details: FlightDetails) => {
      if (!hasSupabase()) {
        localStorage.setItem(`seoulmate_${slotId}`, JSON.stringify(details));
        return;
      }
      const { error } = await sb.from("bookings").upsert({
        id: dbId, trip_id: TRIP_ID, type: "flight",
        title: slotId === "outbound_airasia" ? "KUL→ICN AirAsia X" : "ICN→KUL D7 505",
        data: details,
      }, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: qKey }), [qc, qKey]);

  useEffect(() => {
    if (!hasSupabase()) return;
    const ch = sb.channel(`flight_slot_${dbId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "bookings",
        filter: `id=eq.${dbId}`,
      }, refresh)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, dbId, refresh]);

  return { details: query.data ?? slotDefault, saveDetails: save.mutateAsync, isSaving: save.isPending };
}

/* ── Shared flight edit sheet ── */
function FlightEditSheet({ title, draft, setDraft, onSave, onClose, outbound }: {
  title: string;
  draft: FlightDetails;
  setDraft: (fn: (d: FlightDetails) => FlightDetails) => void;
  onSave: () => void;
  onClose: () => void;
  outbound: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.3)" }}
         onClick={onClose}>
      <div className="bg-cream rounded-t-4xl p-6 pb-10 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-ink-faint mx-auto mb-5" />
        <h3 className="text-lg font-bold text-ink mb-4">{title}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">出发时间</label>
              <input className="input" placeholder={outbound ? "例：23:55" : "例：10:00"} value={draft.depTime}
                onChange={(e) => setDraft(d => ({ ...d, depTime: e.target.value }))} /></div>
            <div><label className="label">到达时间</label>
              <input className="input" placeholder={outbound ? "例：07:30+1" : "例：17:00"} value={draft.arrTime}
                onChange={(e) => setDraft(d => ({ ...d, arrTime: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">行李额度</label>
              <input className="input" placeholder="20kg" value={draft.baggage}
                onChange={(e) => setDraft(d => ({ ...d, baggage: e.target.value }))} /></div>
            <div><label className="label">座位号</label>
              <input className="input" placeholder="例：15A" value={draft.seat}
                onChange={(e) => setDraft(d => ({ ...d, seat: e.target.value }))} /></div>
          </div>
          <div><label className="label">备注</label>
            <input className="input" placeholder="任何附加信息…" value={draft.notes}
              onChange={(e) => setDraft(d => ({ ...d, notes: e.target.value }))} /></div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">取消</button>
            <button onClick={onSave}  className="btn-primary flex-1">保存同步 ☁️</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Outbound KUL → ICN ── */
function FixedFlightCard() {
  const { details, saveDetails, isSaving } = useFlightSlot("outbound_airasia", OUTBOUND_DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState<FlightDetails>(DEFAULT_DETAILS);

  function openEdit() { setDraft(details); setEditing(true); }
  async function saveEdit() { await saveDetails(draft); setEditing(false); }

  return (
    <>
      <div className="rounded-3xl overflow-hidden" style={{ boxShadow: "0 8px 28px rgba(255,0,96,0.13)" }}>
        <div style={{ background: "linear-gradient(135deg, #FF0060, #FF4D94)" }}
             className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-lg font-black tracking-tight">airasia</span>
            <span className="text-white/60 text-xs font-semibold">X</span>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Outbound · 去程</p>
            <p className="text-white font-black text-base tracking-widest">AirAsia X</p>
          </div>
        </div>

        <div className="bg-white px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-3xl font-black text-ink">KUL</p>
              <p className="text-xs text-ink-muted mt-1 font-semibold">KLIA · 吉隆坡</p>
              {details.depTime && <p className="text-base font-black text-ink mt-1">{details.depTime}</p>}
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-petal-400" />
                <p className="text-[10px] text-petal-400 font-bold">出发</p>
              </div>
            </div>
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
            <div className="flex-1 text-right">
              <p className="text-3xl font-black text-ink">ICN</p>
              <p className="text-xs text-ink-muted mt-1 font-semibold">仁川 · 首尔</p>
              {details.arrTime && <p className="text-base font-black text-ink mt-1">{details.arrTime}</p>}
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-sage-50 px-2 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-sage" />
                <p className="text-[10px] text-sage-600 font-bold">到达</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-black/5 grid grid-cols-4 gap-2 text-center">
            <div><p className="text-[9px] text-ink-faint font-semibold uppercase">航空</p><p className="text-xs font-bold text-ink mt-0.5">AirAsia X</p></div>
            <div><p className="text-[9px] text-ink-faint font-semibold uppercase">行李</p><p className="text-xs font-bold text-ink mt-0.5">🧳 {details.baggage}</p></div>
            <div><p className="text-[9px] text-ink-faint font-semibold uppercase">座位</p><p className="text-xs font-bold text-ink mt-0.5">{details.seat || "—"}</p></div>
            <div><p className="text-[9px] text-ink-faint font-semibold uppercase">日期</p><p className="text-xs font-bold text-ink mt-0.5">May 7</p></div>
          </div>
          {details.notes && <p className="mt-3 text-xs text-ink-muted bg-black/3 rounded-2xl px-3 py-2">{details.notes}</p>}
        </div>

        <div className="bg-red-50 px-5 py-2.5 flex items-center justify-between">
          <p className="text-[11px] text-petal-400 font-semibold">📱 提前 3 小时到达 KLIA</p>
          <button onClick={openEdit} disabled={isSaving}
            className="shrink-0 ml-2 bg-white text-petal-400 text-[11px] font-bold rounded-2xl px-3 py-1.5 border border-petal-100">
            ✏️ 编辑
          </button>
        </div>
      </div>

      {editing && (
        <FlightEditSheet title="编辑去程航班" draft={draft} setDraft={setDraft}
          onSave={saveEdit} onClose={() => setEditing(false)} outbound={true} />
      )}
    </>
  );
}

/* ── Return ICN → KUL ── */
function ReturnFlightCard() {
  const { details, saveDetails, isSaving } = useFlightSlot("return_d7505", RETURN_DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState<FlightDetails>(DEFAULT_DETAILS);

  function openEdit() { setDraft(details); setEditing(true); }
  async function saveEdit() { await saveDetails(draft); setEditing(false); }

  return (
    <>
      <div className="rounded-3xl overflow-hidden" style={{ boxShadow: "0 8px 28px rgba(255,0,96,0.13)" }}>
        <div style={{ background: "linear-gradient(135deg, #FF0060, #FF4D94)" }}
             className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-lg font-black tracking-tight">airasia</span>
            <span className="text-white/60 text-xs font-semibold">X</span>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Return</p>
            <p className="text-white font-black text-base tracking-widest">D7 505</p>
          </div>
        </div>

        <div className="bg-white px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-3xl font-black text-ink">ICN</p>
              <p className="text-xs text-ink-muted mt-1 font-semibold">仁川 · 首尔</p>
              {details.depTime && <p className="text-base font-black text-ink mt-1">{details.depTime}</p>}
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-petal-400" />
                <p className="text-[10px] text-petal-400 font-bold">出发</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 px-1">
              <p className="text-[10px] text-ink-faint font-semibold">2026 / 05 / 15</p>
              <div className="flex items-center gap-1 w-full">
                <div className="flex-1 h-px bg-ink-faint/40" />
                <div className="h-7 w-7 rounded-full bg-petal-50 flex items-center justify-center">
                  <Plane className="h-4 w-4 text-petal-400 rotate-45" />
                </div>
                <div className="flex-1 h-px bg-ink-faint/40" />
              </div>
              <p className="text-[10px] text-ink-faint">约 7h 0m</p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-3xl font-black text-ink">KUL</p>
              <p className="text-xs text-ink-muted mt-1 font-semibold">KLIA · 吉隆坡</p>
              {details.arrTime && <p className="text-base font-black text-ink mt-1">{details.arrTime}</p>}
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-sage-50 px-2 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-sage" />
                <p className="text-[10px] text-sage-600 font-bold">到达</p>
              </div>
            </div>
          </div>

          {/* PNR */}
          <div className="mt-3 mb-1 flex items-center justify-center gap-2">
            <div className="flex-1 h-px border-t border-dashed border-black/10" />
            <span className="text-[10px] text-ink-faint font-semibold px-2">PNR · KK3YTR</span>
            <div className="flex-1 h-px border-t border-dashed border-black/10" />
          </div>

          <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-4 gap-2 text-center">
            <div><p className="text-[9px] text-ink-faint font-semibold uppercase">航空</p><p className="text-xs font-bold text-ink mt-0.5">AirAsia X</p></div>
            <div><p className="text-[9px] text-ink-faint font-semibold uppercase">行李</p><p className="text-xs font-bold text-ink mt-0.5">🧳 {details.baggage}</p></div>
            <div><p className="text-[9px] text-ink-faint font-semibold uppercase">座位</p><p className="text-xs font-bold text-ink mt-0.5">{details.seat || "—"}</p></div>
            <div><p className="text-[9px] text-ink-faint font-semibold uppercase">航班</p><p className="text-xs font-bold text-ink mt-0.5">D7 505</p></div>
          </div>
          {details.notes && <p className="mt-3 text-xs text-ink-muted bg-black/3 rounded-2xl px-3 py-2">{details.notes}</p>}
        </div>

        {/* Transport guide */}
        <div className="bg-sage-50 px-5 py-3 border-t border-sage/10">
          <p className="text-[10px] font-black text-sage-700 mb-2">🚇 如何前往仁川机场</p>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-black text-white bg-sage rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">1</span>
              <p className="text-[10px] text-sage-800 leading-relaxed">从 <strong>상수역</strong> 乘地铁 6 号线 → 转 <strong>공덕역</strong> → 换乘 <strong>AREX 空港铁路</strong> → 仁川机场 T2</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-black text-white bg-ginger-400 rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">2</span>
              <p className="text-[10px] text-sage-800 leading-relaxed">或打 <strong>Kakao T 出租车</strong>，约 60-80 分钟，费用约 ₩60,000-80,000</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-bold text-ink-faint bg-black/10 rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">!</span>
              <p className="text-[10px] text-ink-muted leading-relaxed">建议出发前 <strong>3 小时</strong>到达机场</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 px-5 py-2.5 flex items-center justify-between">
          <p className="text-[11px] text-petal-400 font-semibold">🛫 回家咯！May 15</p>
          <button onClick={openEdit} disabled={isSaving}
            className="shrink-0 ml-2 bg-white text-petal-400 text-[11px] font-bold rounded-2xl px-3 py-1.5 border border-petal-100">
            ✏️ 编辑
          </button>
        </div>
      </div>

      {editing && (
        <FlightEditSheet title="编辑回程航班" draft={draft} setDraft={setDraft}
          onSave={saveEdit} onClose={() => setEditing(false)} outbound={false} />
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

/* ── Fixed Hotel Cards ── */
const FIXED_HOTELS = [
  {
    id:          "seoul-airbnb",
    emoji:       "🏠",
    name:        "首尔 Airbnb",
    area:        "홍대 Hongdae · 마포구",
    checkIn:     "2026-05-08",
    checkOut:    "2026-05-11",
    nights:      3,
    code:        "HMXKZYT2HC",
    link:        "https://www.airbnb.co.uk/rooms/1520976768288545606",
    airbnbLink:  "https://www.airbnb.co.uk/rooms/1520976768288545606",
    naverSearch: "홍대 마포구",
    gradFrom:    "#FF385C",
    gradTo:      "#FF7A8A",
    badge:       "首尔 3晚",
    photo:       "https://images.unsplash.com/photo-1584547750936-15b3c2358cc3?w=600&auto=format&fit=crop",
    desc:        "弘大艺文区 · 步行至홍대입구역5分钟 · 周边咖啡厅、酒吧超多",
  },
  {
    id:          "busan-airbnb",
    emoji:       "🌊",
    name:        "釜山 Airbnb",
    area:        "부산 Busan",
    checkIn:     "2026-05-11",
    checkOut:    "2026-05-13",
    nights:      2,
    code:        null,
    link:        "https://www.airbnb.com/l/sBifFSts",
    airbnbLink:  "https://www.airbnb.com/l/sBifFSts",
    naverSearch: "해운대 부산",
    gradFrom:    "#0066FF",
    gradTo:      "#00C2FF",
    badge:       "釜山 2晚",
    photo:       "https://a0.muscache.com/im/pictures/hosting/Hosting-1470114381300992067/original/a397a51b-1358-476f-b3ad-67d4cf89fff7.jpeg?im_w=960",
    desc:        "釜山海景住宿 · 靠近해운대海云台海滩 · 感受海边生活",
  },
  {
    id:          "incheon-hotel",
    emoji:       "✈️",
    name:        "仁川机场酒店",
    area:        "Incheon · ICN 附近",
    checkIn:     "2026-05-13",
    checkOut:    "2026-05-14",
    nights:      1,
    code:        "Trip.com #70141808",
    link:        "https://my.trip.com/hotels/detail/?cityEnName=Incheon&cityId=410&hotelId=70141808&checkIn=2026-05-13&checkOut=2026-05-14&adult=4",
    airbnbLink:  null,
    naverSearch: "인천국제공항 근처 호텔",
    gradFrom:    "#6C3FC5",
    gradTo:      "#9B6DFF",
    badge:       "机场 1晚",
    photo:       "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&auto=format&fit=crop",
    desc:        "仁川国际机场10分钟 · 最后一晚 · 方便明早办理登机",
  },
];

function HotelDateBadge({ dateStr, gradFrom }: { dateStr: string; gradFrom: string }) {
  const d = new Date(dateStr);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return (
    <div className="flex flex-col items-center rounded-2xl px-2.5 py-1.5 min-w-[44px]"
         style={{ background: `${gradFrom}18` }}>
      <span className="text-[8px] font-black tracking-widest" style={{ color: gradFrom }}>{months[d.getMonth()]}</span>
      <span className="text-xl font-black leading-none" style={{ color: gradFrom }}>{d.getDate()}</span>
    </div>
  );
}

function FixedHotelCards() {
  return (
    <>
      {FIXED_HOTELS.map((h) => (
        <div key={h.id} className="rounded-3xl overflow-hidden" style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.12)" }}>
          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, ${h.gradFrom}, ${h.gradTo})` }}
               className="px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-white font-black text-base">{h.emoji} {h.name}</p>
              <p className="text-white/70 text-[11px] font-semibold mt-0.5">{h.area}</p>
            </div>
            <div className="rounded-2xl bg-white/20 px-2.5 py-1">
              <p className="text-white text-[10px] font-black">{h.badge}</p>
            </div>
          </div>

          {/* Photo */}
          {h.photo && (
            <div className="relative h-36 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={h.photo} alt={h.name} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-white text-[10px] font-semibold leading-snug drop-shadow">{h.desc}</p>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="bg-white px-5 py-4">
            {/* Date range */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <HotelDateBadge dateStr={h.checkIn} gradFrom={h.gradFrom} />
                <span className="text-[9px] text-ink-muted font-semibold mt-1">入住</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center gap-1 w-full">
                  <div className="flex-1 h-px bg-black/10" />
                  <Hotel className="h-4 w-4 text-ink-faint" />
                  <div className="flex-1 h-px bg-black/10" />
                </div>
                <span className="text-[10px] text-ink-faint font-semibold mt-1">{h.nights} 晚</span>
              </div>
              <div className="flex flex-col items-center">
                <HotelDateBadge dateStr={h.checkOut} gradFrom={h.gradFrom} />
                <span className="text-[9px] text-ink-muted font-semibold mt-1">退房</span>
              </div>
            </div>

            {/* Reservation code */}
            {h.code && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] text-ink-faint font-semibold">预订码</span>
                <span className="text-[11px] font-black text-ink tracking-widest">{h.code}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <a href={h.link} target="_blank" rel="noreferrer"
                 className="flex-1 text-center rounded-2xl py-2.5 text-xs font-bold text-white"
                 style={{ background: `linear-gradient(135deg, ${h.gradFrom}, ${h.gradTo})` }}>
                {h.airbnbLink ? "🏠 Airbnb 查看" : "🔗 Trip.com 查看"}
              </a>
              <a href={`https://map.naver.com/v5/search/${encodeURIComponent(h.naverSearch)}`}
                 target="_blank" rel="noreferrer"
                 className="flex-1 text-center rounded-2xl py-2.5 text-xs font-bold text-white"
                 style={{ background: "#03C75A" }}>
                📍 Naver 地图
              </a>
            </div>
          </div>
        </div>
      ))}
    </>
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
  const [showForm,  setShowForm]  = useState(false);
  const [form, setForm]           = useState<Partial<Omit<Booking,"id"|"created_at">>>({ type: "flight" });

  const tab      = TABS.find((t) => t.key === activeTab)!;
  const filtered = bookings.filter((b) => b.type === activeTab && !b.id?.includes("__"));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await addBooking.mutateAsync({ ...form, type: activeTab, title: form.title ?? "" } as Omit<Booking,"id"|"created_at">);
    setForm({ type: activeTab }); setShowForm(false);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-cream">
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

      <div className="flex-1 px-4 pb-safe space-y-3">
        {isLoading ? (
          <LoadingPlane text="载入预订信息…" />
        ) : activeTab === "flight" ? (
          <>
            <FixedFlightCard />
            <ReturnFlightCard />
            {filtered.map((b) => (
              <UserFlightCard key={b.id} b={b} onDelete={() => removeBooking.mutate(b.id)} />
            ))}
          </>
        ) : activeTab === "hotel" ? (
          <>
            <FixedHotelCards />
            {filtered.map((b) => (
              <GenericCard key={b.id} b={b} tab={tab} onDelete={() => removeBooking.mutate(b.id)} />
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

      {activeTab !== "flight" && (
        <button onClick={() => { setForm({ type: activeTab }); setShowForm(true); }}
          className="fixed bottom-32 right-5 h-14 w-14 rounded-full bg-ginger flex items-center justify-center z-30 text-white"
          style={{ boxShadow: "0 6px 24px rgba(232,168,0,0.35)" }}>
          <Plus className="h-6 w-6" />
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
             style={{ background: "rgba(0,0,0,0.3)" }} onClick={() => setShowForm(false)}>
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
                  <div><label className="label">入住日期</label>
                    <input className="input" type="date" value={form.check_in ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, check_in: e.target.value }))} /></div>
                  <div><label className="label">退房日期</label>
                    <input className="input" type="date" value={form.check_out ?? ""}
                      onChange={(e) => setForm(f => ({ ...f, check_out: e.target.value }))} /></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">价格</label>
                  <input className="input" placeholder="0" type="number" value={form.price ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div><label className="label">币种</label>
                  <input className="input" placeholder="MYR" value={form.currency ?? ""}
                    onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))} /></div>
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
