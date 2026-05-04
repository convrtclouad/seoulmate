import { NextResponse } from "next/server";

// Mock rate: 1 KRW ≈ 0.003421 MYR (as of 2025)
const MOCK_RATE = 0.003421;

export async function GET() {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      from: "KRW",
      to:   "MYR",
      rate: MOCK_RATE,
      source: "mock",
    });
  }

  try {
    // ExchangeRate-API: https://www.exchangerate-api.com/
    const res  = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/KRW/MYR`,
      { next: { revalidate: 21600 } }  // 6-hour Next.js cache
    );

    if (!res.ok) throw new Error("Exchange rate API error");

    const data  = await res.json();
    const rate: number = data.conversion_rate;

    return NextResponse.json({
      from:   "KRW",
      to:     "MYR",
      rate,
      source: "live",
    });
  } catch (err) {
    console.error("[/api/exchange-rate]", err);
    // Fallback to mock
    return NextResponse.json({
      from:   "KRW",
      to:     "MYR",
      rate:   MOCK_RATE,
      source: "fallback",
    });
  }
}
