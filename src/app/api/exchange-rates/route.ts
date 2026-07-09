import { NextResponse } from "next/server";

export type RateSource = "ecb" | "open-er-api" | "fallback";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let cachedData: {
  rates: Record<string, number>;
  sources: Record<string, RateSource>;
  timestamp: number;
} | null = null;

/**
 * Currencies the household actually holds; the secondary source fills any of
 * these that the primary (ECB via frankfurter) does not serve — notably COP.
 */
const REQUIRED_CURRENCIES = ["USD", "EUR", "COP", "GBP", "CHF"];

// Last-resort constants, labeled as such in the response so the UI can badge
// them. Never presented as live rates.
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  COP: 4000,
};

async function fetchPrimary(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_EXCHANGE_API_URL || "https://api.frankfurter.app"}/latest?from=USD`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { USD: 1, ...data.rates };
  } catch {
    return null;
  }
}

async function fetchSecondary(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.result === "success" && data.rates ? data.rates : null;
  } catch {
    return null;
  }
}

export async function GET() {
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return NextResponse.json({
      rates: cachedData.rates,
      sources: cachedData.sources,
      stale: false,
    });
  }

  const primary = await fetchPrimary();
  const rates: Record<string, number> = {};
  const sources: Record<string, RateSource> = {};

  if (primary) {
    for (const [code, rate] of Object.entries(primary)) {
      rates[code] = rate;
      sources[code] = "ecb";
    }
  }

  // Fill gaps (e.g. COP is not an ECB reference currency) from the secondary
  const missing = REQUIRED_CURRENCIES.filter((code) => !(code in rates));
  if (missing.length > 0) {
    const secondary = await fetchSecondary();
    if (secondary) {
      for (const code of missing) {
        if (typeof secondary[code] === "number") {
          rates[code] = secondary[code];
          sources[code] = "open-er-api";
        }
      }
    }
  }

  if (Object.keys(rates).length > 0) {
    for (const code of REQUIRED_CURRENCIES) {
      if (!(code in rates) && code in FALLBACK_RATES) {
        rates[code] = FALLBACK_RATES[code];
        sources[code] = "fallback";
      }
    }
    cachedData = { rates, sources, timestamp: Date.now() };
    return NextResponse.json({ rates, sources, stale: false });
  }

  // Both providers down
  if (cachedData) {
    return NextResponse.json({
      rates: cachedData.rates,
      sources: cachedData.sources,
      stale: true,
    });
  }
  const fallbackSources = Object.fromEntries(
    Object.keys(FALLBACK_RATES).map((code) => [code, "fallback" as const])
  );
  return NextResponse.json(
    { rates: FALLBACK_RATES, sources: fallbackSources, stale: true },
    { status: 503 }
  );
}
