"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { buildDebtMatrix } from "@/lib/utils/expense-splitter";
import { tap, success } from "@/lib/utils/haptics";
import type { Expense, Profile } from "@/types";

interface DebtMatrixProps {
  expenses: Expense[];
  profiles: Profile[];
  currentUserId: string;
  settled?: Set<string>;
  onToggleSettle?: (debtorId: string, creditorId: string) => void;
  /** @deprecated use onToggleSettle */
  onSettle?: (debtorId: string, creditorId: string) => void;
}

/* ── Confetti burst ── */
const CONFETTI_COLORS = ["#E87060", "#5B8862", "#8B7AB8", "#E8A800", "#4A9592", "#F4A590", "#6BA3BE"];
const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * 360;
  const dist  = 38 + (i % 3) * 18;
  const tx    = Math.round(Math.cos((angle * Math.PI) / 180) * dist);
  const ty    = Math.round(Math.sin((angle * Math.PI) / 180) * dist);
  const size  = 5 + (i % 3);
  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  const delay = i * 28;
  return { tx, ty, size, color, delay };
});

function ConfettiBurst() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20, overflow: "visible" }}>
      {PARTICLES.map((p, i) => (
        <div key={i} style={{
          position:       "absolute",
          right:          14,
          top:            "50%",
          width:          p.size,
          height:         p.size,
          borderRadius:   i % 2 === 0 ? "50%" : 2,
          background:     p.color,
          animation:      `confettiBurst 0.65s ease-out forwards`,
          animationDelay: `${p.delay}ms`,
          "--tx": `${p.tx}px`,
          "--ty": `${p.ty - 20}px`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

function Bubble({ name }: { name: string }) {
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center text-sm font-bold text-sage-600 shrink-0">
      {name.charAt(0)}
    </div>
  );
}

function DebtCard({
  debtorLabel,
  creditorLabel,
  amount,
  isSettled,
  onToggle,
}: {
  debtorLabel: string;
  creditorLabel: string;
  amount: number;
  isSettled: boolean;
  onToggle: () => void;
}) {
  const [showConfetti, setShowConfetti] = useState(false);

  function handleToggle() {
    if (!isSettled) {
      success();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 900);
    } else {
      tap();
    }
    onToggle();
  }

  return (
    <div
      className={`rounded-3xl bg-surface p-4 flex items-center gap-3 transition-all relative ${isSettled ? "opacity-50" : ""}`}
      style={{ boxShadow: "var(--shadow-card)", overflow: "visible" }}
    >
      {showConfetti && <ConfettiBurst />}
      <Bubble name={debtorLabel} />
      <ArrowRight className="h-4 w-4 text-ink-faint shrink-0" />
      <Bubble name={creditorLabel} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-muted">{debtorLabel} → {creditorLabel}</p>
        <p className={`font-black text-base ${isSettled ? "line-through text-ink-faint" : "text-ink"}`}>
          ₩{amount.toLocaleString("ko-KR")}
        </p>
        {isSettled && <p className="text-[10px] text-sage-600 font-bold mt-0.5">✓ 已结清</p>}
      </div>
      <button
        onClick={handleToggle}
        className={`shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${
          isSettled
            ? "bg-sage-100 text-sage-600"
            : "bg-black/5 text-ink-faint hover:bg-sage-100 hover:text-sage-600"
        }`}
        title={isSettled ? "取消结清" : "标记为已结清"}>
        <CheckCircle2 className="h-5 w-5" strokeWidth={isSettled ? 2.5 : 1.5} />
      </button>
    </div>
  );
}

export function DebtMatrix({ expenses, profiles, currentUserId, settled = new Set(), onToggleSettle }: DebtMatrixProps) {
  const debts = buildDebtMatrix(expenses, profiles);

  if (debts.length === 0) {
    return (
      <div className="rounded-3xl bg-surface p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="text-4xl mb-3">🎉</div>
        <p className="font-bold text-ink text-sm">大家都结清啦！</p>
        <p className="text-xs text-ink-muted mt-1">目前没有未结算的欠款</p>
      </div>
    );
  }

  const iOwe   = debts.filter((d) => d.debtorId === currentUserId);
  const owedMe = debts.filter((d) => d.creditorId === currentUserId);
  const others = debts.filter(
    (d) => d.debtorId !== currentUserId && d.creditorId !== currentUserId
  );

  const getName    = (p?: Profile | null) => p?.display_name ?? "?";
  const isSettled  = (debtorId: string, creditorId: string) => settled.has(`${debtorId}→${creditorId}`);
  const pendingCnt = debts.filter((d) => !isSettled(d.debtorId, d.creditorId)).length;
  const allSettled = pendingCnt === 0 && debts.length > 0;

  return (
    <div className="space-y-4 pb-8">
      <style>{`
        @keyframes confettiBurst {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          80%  { opacity: 0.7; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-muted font-medium">
          {debts.length} 笔债务 · {debts.length - pendingCnt} 笔已结清
        </p>
        {allSettled && (
          <span className="text-xs font-bold text-sage-600 bg-sage-100 rounded-full px-3 py-1">🎉 全部结清</span>
        )}
      </div>

      {iOwe.length > 0 && (
        <div>
          <p className="text-xs font-bold text-petal-400 uppercase tracking-wider mb-2">💸 我需要还款</p>
          <div className="space-y-2">
            {iOwe.map((debt) => (
              <DebtCard
                key={`${debt.debtorId}-${debt.creditorId}`}
                debtorLabel="我"
                creditorLabel={getName(debt.creditor)}
                amount={debt.amountKrw}
                isSettled={isSettled(debt.debtorId, debt.creditorId)}
                onToggle={() => onToggleSettle?.(debt.debtorId, debt.creditorId)}
              />
            ))}
          </div>
        </div>
      )}

      {owedMe.length > 0 && (
        <div>
          <p className="text-xs font-bold text-sage-600 uppercase tracking-wider mb-2">✅ 别人欠我</p>
          <div className="space-y-2">
            {owedMe.map((debt) => (
              <DebtCard
                key={`${debt.debtorId}-${debt.creditorId}`}
                debtorLabel={getName(debt.debtor)}
                creditorLabel="我"
                amount={debt.amountKrw}
                isSettled={isSettled(debt.debtorId, debt.creditorId)}
                onToggle={() => onToggleSettle?.(debt.debtorId, debt.creditorId)}
              />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">👥 成员之间</p>
          <div className="space-y-2">
            {others.map((debt) => (
              <DebtCard
                key={`${debt.debtorId}-${debt.creditorId}`}
                debtorLabel={getName(debt.debtor)}
                creditorLabel={getName(debt.creditor)}
                amount={debt.amountKrw}
                isSettled={isSettled(debt.debtorId, debt.creditorId)}
                onToggle={() => onToggleSettle?.(debt.debtorId, debt.creditorId)}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-ink-faint pt-2">
        点击 ✓ 标记已结清 · 结清时会有彩纸庆祝 🎊
      </p>
    </div>
  );
}
