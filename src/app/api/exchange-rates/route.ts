import { NextResponse } from "next/server";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let cachedData: { rates: Record<string, number>; timestamp: number } | null =
  null;

export async function GET() {
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return NextResponse.json({
      rates: cachedData.rates,
      stale: false,
    });
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_EXCHANGE_API_URL || "https://api.frankfurter.app"}/latest?from=USD`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) throw new Error("Exchange API unavailable");

    const data = await res.json();
    const rates: Record<string, number> = { USD: 1, ...data.rates };

    cachedData = { rates, timestamp: Date.now() };

    return NextResponse.json({ rates, stale: false });
  } catch {
    if (cachedData) {
      return NextResponse.json({ rates: cachedData.rates, stale: true });
    }
    return NextResponse.json(
      { rates: { USD: 1, EUR: 0.92 }, stale: true },
      { status: 503 }
    );
  }
}
