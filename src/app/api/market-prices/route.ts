import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMarketPrice } from "@/lib/market-data";
import { buildAssetKey } from "@/lib/investments";
import { getDefaultTwelveSymbol } from "@/lib/investments";
import type { Database } from "@/types/database";
import {
  assetTypeSchema,
  marketCodeSchema,
} from "@/lib/validations";

const querySchema = z.object({
  symbol: z.string().min(1),
  assetType: assetTypeSchema,
  marketCode: marketCodeSchema,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  exchangeCode: z.string().optional(),
  providerSymbolTwelve: z.string().optional(),
  providerSymbolEodhd: z.string().optional(),
});

const batchItemSchema = querySchema.extend({
  assetKey: z.string().min(1).optional(),
});

const batchBodySchema = z.object({
  assets: z.array(batchItemSchema).min(1).max(80),
});

type AssetRow = Database["public"]["Tables"]["investment_assets"]["Row"];
type QuoteRow = Database["public"]["Tables"]["market_price_history"]["Row"];

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await mapper(items[index]);
      }
    })
  );
  return results;
}

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    symbol: request.nextUrl.searchParams.get("symbol"),
    assetType: request.nextUrl.searchParams.get("assetType"),
    marketCode: request.nextUrl.searchParams.get("marketCode"),
    date: request.nextUrl.searchParams.get("date") ?? undefined,
    exchangeCode: request.nextUrl.searchParams.get("exchangeCode") ?? undefined,
    providerSymbolTwelve:
      request.nextUrl.searchParams.get("providerSymbolTwelve") ?? undefined,
    providerSymbolEodhd:
      request.nextUrl.searchParams.get("providerSymbolEodhd") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid market price query" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const quote = await getMarketPrice({
      supabase,
      symbol: parsed.data.symbol,
      assetType: parsed.data.assetType,
      marketCode: parsed.data.marketCode,
      date: parsed.data.date,
      exchangeCode: parsed.data.exchangeCode,
      providerSymbolTwelve: parsed.data.providerSymbolTwelve,
      providerSymbolEodhd: parsed.data.providerSymbolEodhd,
    });

    return NextResponse.json(quote);
  } catch {
    return NextResponse.json(
      { error: "Unable to resolve market price" },
      { status: 500 }
    );
  }
}

/** Batch quotes in one request — kills the per-asset N+1 from the client. */
export async function POST(request: NextRequest) {
  const parsed = batchBodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid market price batch" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const uniqueAssets = Array.from(
      new Map(
        parsed.data.assets.map((asset) => {
          const assetKey =
            asset.assetKey ??
            buildAssetKey(asset.marketCode, asset.symbol, asset.exchangeCode);
          return [assetKey, { ...asset, assetKey }] as const;
        })
      ).values()
    );
    const assetKeys = uniqueAssets.map((asset) => asset.assetKey);
    const { data: metadataRows } = await supabase
      .from("investment_assets")
      .select("*")
      .in("asset_key", assetKeys);
    const metadata = new Map(
      ((metadataRows ?? []) as AssetRow[]).map((asset) => [asset.asset_key, asset])
    );
    const providerSymbols = uniqueAssets.flatMap((asset) => {
      const row = metadata.get(asset.assetKey);
      return [
        asset.providerSymbolTwelve ??
          row?.provider_symbol_twelve ??
          getDefaultTwelveSymbol(asset.symbol, asset.marketCode, asset.assetType),
        asset.providerSymbolEodhd ?? row?.provider_symbol_eodhd ?? null,
      ].filter((symbol): symbol is string => Boolean(symbol));
    });
    const latestCache = new Map<string, QuoteRow>();
    if (providerSymbols.length > 0) {
      const { data: cachedRows } = await supabase
        .from("market_price_history")
        .select("*")
        .in("provider_symbol", [...new Set(providerSymbols)])
        .order("quote_date", { ascending: false });
      const freshAfter = Date.now() - 15 * 60 * 1000;
      for (const row of (cachedRows ?? []) as QuoteRow[]) {
        const key = `${row.provider}|${row.provider_symbol}`;
        if (
          !latestCache.has(key) &&
          new Date(row.fetched_at).getTime() >= freshAfter
        ) {
          latestCache.set(key, row);
        }
      }
    }

    const quotes = await mapWithConcurrency(uniqueAssets, 5, async (asset) => {
        try {
          const quote = await getMarketPrice({
            supabase,
            symbol: asset.symbol,
            assetType: asset.assetType,
            marketCode: asset.marketCode,
            date: asset.date,
            exchangeCode: asset.exchangeCode,
            providerSymbolTwelve: asset.providerSymbolTwelve,
            providerSymbolEodhd: asset.providerSymbolEodhd,
            assetMetadata: metadata.get(asset.assetKey) ?? null,
            latestCache: asset.date ? undefined : latestCache,
          });
          return {
            ...quote,
            assetKey:
              asset.assetKey,
          };
        } catch {
          return null;
        }
      });

    return NextResponse.json({
      quotes: quotes.filter((quote) => quote !== null),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to resolve market prices" },
      { status: 500 }
    );
  }
}
