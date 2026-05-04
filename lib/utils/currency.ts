// ─── Currency Utilities ───────────────────────────────────────────────────────
// KRW ⇌ MYR conversion with caching + fallback mock rate

const CACHE_KEY = "seoulmate_exchange_rate";
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

interface CachedRate {
  rate: number;
  fetchedAt: number;
}

// Mock fallback rate (1 KRW → MYR) — approx as of 2025
const MOCK_KRW_TO_MYR = 0.003421;

function getCachedRate(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRate = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt > CACHE_TTL) return null;
    return cached.rate;
  } catch {
    return null;
  }
}

function setCachedRate(rate: number) {
  if (typeof window === "undefined") return;
  const data: CachedRate = { rate, fetchedAt: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

export async function fetchExchangeRate(): Promise<number> {
  const cached = getCachedRate();
  if (cached !== null) return cached;

  try {
    const res = await fetch("/api/exchange-rate");
    if (!res.ok) throw new Error("Exchange rate fetch failed");
    const data = await res.json();
    const rate: number = data.rate;
    setCachedRate(rate);
    return rate;
  } catch {
    // Fallback to mock rate — display warning in UI
    console.warn("[SeoulMate] Using mock exchange rate — API unavailable");
    return MOCK_KRW_TO_MYR;
  }
}

export function krwToMyr(krw: number, rate: number): number {
  return parseFloat((krw * rate).toFixed(4));
}

export function myrToKrw(myr: number, rate: number): number {
  return Math.round(myr / rate);
}

export function formatKrw(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMyr(amount: number): string {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: "KRW" | "MYR"): string {
  return currency === "KRW" ? formatKrw(amount) : formatMyr(amount);
}
