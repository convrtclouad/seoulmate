"use client";

import { useState, useEffect } from "react";
import { ArrowLeftRight, TrendingUp } from "lucide-react";
import { fetchExchangeRate, formatKrw, formatMyr, krwToMyr } from "@/lib/utils/currency";

interface CurrencyDisplayProps {
  amountKrw: number;
  showToggle?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  amountKrw,
  showToggle = true,
  className = "",
}: CurrencyDisplayProps) {
  const [showMyr, setShowMyr] = useState(false);
  const [rate, setRate]       = useState<number | null>(null);

  useEffect(() => {
    fetchExchangeRate().then(setRate);
  }, []);

  const myr = rate !== null ? krwToMyr(amountKrw, rate) : null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-bold text-gray-900">
        {showMyr && myr !== null ? formatMyr(myr) : formatKrw(amountKrw)}
      </span>

      {showToggle && myr !== null && (
        <button
          onClick={() => setShowMyr(!showMyr)}
          className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
          title={showMyr ? "Show KRW" : "Show MYR"}
        >
          <ArrowLeftRight className="h-3.5 w-3.5 text-gray-400" />
        </button>
      )}
    </div>
  );
}

export function ExchangeRateBadge() {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    fetchExchangeRate().then(setRate);
  }, []);

  if (!rate) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-forest-mist border border-forest-pale px-3 py-1">
      <TrendingUp className="h-3 w-3 text-forest-mid" />
      <span className="text-xs font-medium text-forest">
        1 MYR = {(1 / rate).toLocaleString("ko-KR", { maximumFractionDigits: 0 })} KRW
      </span>
    </div>
  );
}
