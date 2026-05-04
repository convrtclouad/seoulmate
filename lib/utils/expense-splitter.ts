import type { Expense, ExpenseSplit, DebtEntry, Profile } from "@/types";

// ─── Expense Splitting Logic ──────────────────────────────────────────────────

export interface SplitCalculation {
  userId: string;
  shareKrw: number;
  shareMyr: number;
}

/**
 * Calculate equal splits for a list of participants.
 * Remainder cents go to the first participant.
 */
export function calculateEqualSplits(
  totalKrw: number,
  totalMyr: number,
  participantIds: string[]
): SplitCalculation[] {
  const n = participantIds.length;
  if (n === 0) return [];

  const baseKrw = Math.floor(totalKrw / n);
  const baseMyr = parseFloat((totalMyr / n).toFixed(4));
  const remainderKrw = totalKrw - baseKrw * n;

  return participantIds.map((userId, idx) => ({
    userId,
    shareKrw: idx === 0 ? baseKrw + remainderKrw : baseKrw,
    shareMyr: baseMyr,
  }));
}

/**
 * Calculate custom splits from a percentage or fixed-amount map.
 */
export function calculateCustomSplits(
  totalKrw: number,
  totalMyr: number,
  splits: Record<string, number>  // userId → KRW amount
): SplitCalculation[] {
  return Object.entries(splits).map(([userId, shareKrw]) => ({
    userId,
    shareKrw,
    shareMyr: parseFloat(((shareKrw / totalKrw) * totalMyr).toFixed(4)),
  }));
}

// ─── Debt Matrix ─────────────────────────────────────────────────────────────

interface RawDebt {
  debtorId: string;
  creditorId: string;
  amountKrw: number;
  amountMyr: number;
}

/**
 * Build a simplified debt matrix from a list of expenses + splits.
 * Nets out A-owes-B and B-owes-A into a single direction.
 */
export function buildDebtMatrix(
  expenses: Expense[],
  profiles: Profile[]
): DebtEntry[] {
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  // Accumulate gross debts: key = "debtorId|creditorId"
  const gross = new Map<string, RawDebt>();

  for (const expense of expenses) {
    if (!expense.splits) continue;
    for (const split of expense.splits) {
      if (split.is_settled) continue;
      if (split.user_id === expense.paid_by) continue; // payer doesn't owe themselves

      const key = `${split.user_id}|${expense.paid_by}`;
      const existing = gross.get(key);
      if (existing) {
        existing.amountKrw += split.share_krw;
        existing.amountMyr += split.share_myr ?? 0;
      } else {
        gross.set(key, {
          debtorId:   split.user_id,
          creditorId: expense.paid_by,
          amountKrw:  split.share_krw,
          amountMyr:  split.share_myr ?? 0,
        });
      }
    }
  }

  // Net out opposing debts
  const netted = new Map<string, RawDebt>();

  for (const [key, debt] of gross.entries()) {
    const reverseKey = `${debt.creditorId}|${debt.debtorId}`;
    const reverse = gross.get(reverseKey);

    if (reverse && !netted.has(reverseKey)) {
      const netKrw = debt.amountKrw - reverse.amountKrw;
      if (Math.abs(netKrw) < 1) continue; // effectively zero

      if (netKrw > 0) {
        netted.set(key, { ...debt, amountKrw: netKrw, amountMyr: debt.amountMyr - reverse.amountMyr });
      } else {
        netted.set(reverseKey, { ...reverse, amountKrw: -netKrw, amountMyr: reverse.amountMyr - debt.amountMyr });
      }
    } else if (!netted.has(reverseKey)) {
      netted.set(key, debt);
    }
  }

  return Array.from(netted.values()).map((d) => ({
    debtorId:   d.debtorId,
    creditorId: d.creditorId,
    amountKrw:  d.amountKrw,
    amountMyr:  d.amountMyr,
    debtor:     profileMap.get(d.debtorId),
    creditor:   profileMap.get(d.creditorId),
  }));
}

/**
 * Compute how much each person has paid vs owes.
 * Returns a map of userId → net balance in KRW (positive = owed money, negative = owes money).
 */
export function computeBalances(expenses: Expense[]): Map<string, number> {
  const balances = new Map<string, number>();

  const add = (userId: string, delta: number) => {
    balances.set(userId, (balances.get(userId) ?? 0) + delta);
  };

  for (const expense of expenses) {
    // Payer gets credited the full amount
    add(expense.paid_by, expense.amount_krw);

    // Each split participant gets debited their share
    if (expense.splits) {
      for (const split of expense.splits) {
        add(split.user_id, -split.share_krw);
      }
    }
  }

  return balances;
}
