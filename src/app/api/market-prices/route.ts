import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getMarketPrice } from "@/lib/market-data";
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
