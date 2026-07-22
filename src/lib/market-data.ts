import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";
import type { Database } from "@/types/database";
import {
  buildAssetKey,
  getDefaultTwelveSymbol,
  type AssetType,
  type MarketCode,
  type MarketPriceResponse,
  type ReferenceStatus,
} from "@/lib/investments";

type ServerSupabase = SupabaseClient<Database>;
type MarketPriceRow = Database["public"]["Tables"]["market_price_history"]["Row"];
type InvestmentAssetRow = Database["public"]["Tables"]["investment_assets"]["Row"];

const LATEST_CACHE_TTL_MS = 15 * 60 * 1000;
const HISTORICAL_FALLBACK_DAYS = 7;

function getTwelveDataApiKey() {
  return process.env.TWELVE_DATA_API_KEY?.trim() || null;
}

function getEodhdApiKey() {
  return process.env.EODHD_API_KEY?.trim() || null;
}

function toDateParam(date?: string | null) {
  return date ? format(new Date(date), "yyyy-MM-dd") : null;
}

function normalizeProviderDate(value: string | undefined) {
  if (!value) return null;
  return value.slice(0, 10);
}

function isFresh(row: Pick<MarketPriceRow, "fetched_at">) {
  return Date.now() - new Date(row.fetched_at).getTime() < LATEST_CACHE_TTL_MS;
}

async function findAssetMetadata(
  supabase: ServerSupabase,
  params: {
    symbol: string;
    marketCode: MarketCode;
    exchangeCode?: string | null;
  }
) {
  const assetKey = buildAssetKey(
    params.marketCode,
    params.symbol,
    params.exchangeCode
  );

  const { data } = await supabase
    .from("investment_assets")
    .select("*")
    .eq("asset_key", assetKey)
    .maybeSingle();

  return data ?? null;
}

async function readCachedHistoricalQuote(
  supabase: ServerSupabase,
  provider: string,
  providerSymbol: string,
  requestedDate: string
) {
  const lookbackStart = format(
    subDays(new Date(requestedDate), HISTORICAL_FALLBACK_DAYS),
    "yyyy-MM-dd"
  );
  const { data } = await supabase
    .from("market_price_history")
    .select("*")
    .eq("provider", provider)
    .eq("provider_symbol", providerSymbol)
    .gte("quote_date", lookbackStart)
    .lte("quote_date", requestedDate)
    .order("quote_date", { ascending: false })
    .limit(1);

  return data?.[0] ?? null;
}

async function readCachedLatestQuote(
  supabase: ServerSupabase,
  provider: string,
  providerSymbol: string
) {
  const { data } = await supabase
    .from("market_price_history")
    .select("*")
    .eq("provider", provider)
    .eq("provider_symbol", providerSymbol)
    .order("quote_date", { ascending: false })
    .limit(1);

  const row = data?.[0] ?? null;
  if (!row || !isFresh(row)) {
    return null;
  }

  return row;
}

async function writeCachedQuote(
  supabase: ServerSupabase,
  payload: {
    provider: string;
    providerSymbol: string;
    quoteDate: string;
    close: number;
    currency: string;
  }
) {
  await supabase.from("market_price_history").upsert(
    {
      provider: payload.provider,
      provider_symbol: payload.providerSymbol,
      quote_date: payload.quoteDate,
      close: payload.close,
      currency: payload.currency,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "provider,provider_symbol,quote_date" }
  );
}

function buildCachedResponse({
  symbol,
  assetType,
  marketCode,
  requestedDate,
  row,
  source,
}: {
  symbol: string;
  assetType: AssetType;
  marketCode: MarketCode;
  requestedDate: string | null;
  row: MarketPriceRow;
  source: string;
}): MarketPriceResponse {
  const status: ReferenceStatus =
    requestedDate === null || row.quote_date === requestedDate
      ? "fetched"
      : "fallback_previous_trading_day";

  return {
    symbol,
    assetType,
    marketCode,
    requestedDate,
    resolvedDate: row.quote_date,
    close: Number(row.close),
    currency: row.currency,
    source,
    status,
    cached: true,
  };
}

async function fetchTwelveDataQuote({
  symbol,
  assetType,
  marketCode,
  requestedDate,
  fallbackCurrency,
}: {
  symbol: string;
  assetType: AssetType;
  marketCode: MarketCode;
  requestedDate: string | null;
  fallbackCurrency: string;
}) {
  const apiKey = getTwelveDataApiKey();
  const providerSymbol = getDefaultTwelveSymbol(symbol, marketCode, assetType);
  if (!apiKey || !providerSymbol) {
    return null;
  }

  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", providerSymbol);
  url.searchParams.set("interval", "1day");
  url.searchParams.set("outputsize", requestedDate ? "5" : "1");
  url.searchParams.set("order", "DESC");
  url.searchParams.set("apikey", apiKey);

  if (requestedDate) {
    url.searchParams.set("end_date", requestedDate);
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    status?: string;
    values?: Array<{ datetime: string; close: string }>;
    meta?: { currency?: string };
  };

  if (!Array.isArray(data.values) || data.values.length === 0) {
    return null;
  }

  const resolved = data.values
    .map((item) => ({
      date: normalizeProviderDate(item.datetime),
      close: Number(item.close),
    }))
    .find((item) => item.date !== null && (!requestedDate || item.date <= requestedDate));

  if (!resolved?.date || Number.isNaN(resolved.close)) {
    return null;
  }

  return {
    provider: "twelve_data",
    providerSymbol,
    quoteDate: resolved.date,
    close: resolved.close,
    currency: data.meta?.currency ?? fallbackCurrency,
    status:
      requestedDate && resolved.date !== requestedDate
        ? ("fallback_previous_trading_day" as const)
        : ("fetched" as const),
  };
}

async function fetchEodhdQuote({
  providerSymbol,
  requestedDate,
  fallbackCurrency,
}: {
  providerSymbol: string;
  requestedDate: string | null;
  fallbackCurrency: string;
}) {
  const apiKey = getEodhdApiKey();
  if (!apiKey) {
    return null;
  }

  const effectiveTo = requestedDate ?? format(new Date(), "yyyy-MM-dd");
  const effectiveFrom = requestedDate
    ? format(subDays(new Date(requestedDate), HISTORICAL_FALLBACK_DAYS), "yyyy-MM-dd")
    : format(subDays(new Date(), HISTORICAL_FALLBACK_DAYS), "yyyy-MM-dd");

  const url = new URL(`https://eodhd.com/api/eod/${providerSymbol}`);
  url.searchParams.set("from", effectiveFrom);
  url.searchParams.set("to", effectiveTo);
  url.searchParams.set("period", "d");
  url.searchParams.set("fmt", "json");
  url.searchParams.set("api_token", apiKey);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Array<{
    date: string;
    adjusted_close?: number;
    close?: number;
  }>;

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const sorted = [...data].sort((left, right) => right.date.localeCompare(left.date));
  const resolved = sorted.find(
    (item) => !requestedDate || item.date <= requestedDate
  );

  if (!resolved) {
    return null;
  }

  const close = Number(resolved.adjusted_close ?? resolved.close);
  if (Number.isNaN(close)) {
    return null;
  }

  return {
    provider: "eodhd",
    providerSymbol,
    quoteDate: resolved.date,
    close,
    currency: fallbackCurrency,
    status:
      requestedDate && resolved.date !== requestedDate
        ? ("fallback_previous_trading_day" as const)
        : ("fetched" as const),
  };
}

export async function getMarketPrice({
  supabase,
  symbol,
  assetType,
  marketCode,
  date,
  exchangeCode,
  providerSymbolTwelve,
  providerSymbolEodhd,
  assetMetadata,
  latestCache,
}: {
  supabase: ServerSupabase;
  symbol: string;
  assetType: AssetType;
  marketCode: MarketCode;
  date?: string | null;
  exchangeCode?: string | null;
  providerSymbolTwelve?: string | null;
  providerSymbolEodhd?: string | null;
  assetMetadata?: InvestmentAssetRow | null;
  latestCache?: Map<string, MarketPriceRow>;
}): Promise<MarketPriceResponse> {
  const requestedDate = toDateParam(date);
  const normalizedSymbol = symbol.trim().toUpperCase();
  const asset =
    assetMetadata === undefined
      ? await findAssetMetadata(supabase, {
          symbol: normalizedSymbol,
          marketCode,
          exchangeCode,
        })
      : assetMetadata;
  const fallbackCurrency =
    asset?.quote_currency ??
    (marketCode === "CO" ? "COP" : "USD");

  const providerCandidates = [
    {
      provider: "twelve_data",
      providerSymbol:
        providerSymbolTwelve ??
        asset?.provider_symbol_twelve ??
        getDefaultTwelveSymbol(normalizedSymbol, marketCode, assetType),
      fetcher: () =>
        fetchTwelveDataQuote({
          symbol: normalizedSymbol,
          assetType,
          marketCode,
          requestedDate,
          fallbackCurrency,
        }),
    },
    {
      provider: "eodhd",
      providerSymbol: providerSymbolEodhd ?? asset?.provider_symbol_eodhd ?? null,
      fetcher: () =>
        providerSymbolEodhd || asset?.provider_symbol_eodhd
          ? fetchEodhdQuote({
              providerSymbol:
                providerSymbolEodhd ?? asset?.provider_symbol_eodhd ?? "",
              requestedDate,
              fallbackCurrency,
            })
          : Promise.resolve(null),
    },
  ].filter((candidate) => candidate.providerSymbol);

  for (const candidate of providerCandidates) {
    const cached = requestedDate
      ? await readCachedHistoricalQuote(
          supabase,
          candidate.provider,
          candidate.providerSymbol!,
          requestedDate
        )
      : latestCache?.get(`${candidate.provider}|${candidate.providerSymbol}`) ??
        (await readCachedLatestQuote(
          supabase,
          candidate.provider,
          candidate.providerSymbol!
        ));

    if (cached) {
      return buildCachedResponse({
        symbol: normalizedSymbol,
        assetType,
        marketCode,
        requestedDate,
        row: cached,
        source: candidate.provider,
      });
    }

    const fetched = await candidate.fetcher();
    if (!fetched) {
      continue;
    }

    await writeCachedQuote(supabase, fetched);

    return {
      symbol: normalizedSymbol,
      assetType,
      marketCode,
      requestedDate,
      resolvedDate: fetched.quoteDate,
      close: fetched.close,
      currency: fetched.currency,
      source: fetched.provider,
      status: fetched.status,
      cached: false,
    };
  }

  return {
    symbol: normalizedSymbol,
    assetType,
    marketCode,
    requestedDate,
    resolvedDate: null,
    close: null,
    currency: fallbackCurrency,
    source: null,
    status: "unavailable",
    cached: false,
  };
}
