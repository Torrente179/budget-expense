import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRequestClient } from "@/lib/supabase/request";
import { isMissingTableError } from "@/lib/supabase/postgrest-errors";

/**
 * Net-worth history for the Evolución chart.
 *
 * The client sends already-converted component totals because FX conversion
 * only exists client-side (`CurrencyProvider.convert`). The server never
 * trusts a client-sent `total_assets` or `net_worth` — it derives both from
 * the components, so the stored row is always internally consistent.
 */
const snapshotSchema = z.object({
  as_of_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  base_currency: z.string().trim().length(3).toUpperCase(),
  accounts_and_cash: z.number().finite(),
  savings: z.number().finite(),
  investments: z.number().finite(),
  money_lent: z.number().finite(),
  debts: z.number().finite(),
});

function roundToCents(value: number) {
  return Math.round(value * 100) / 100;
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let query = supabase
    .from("net_worth_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("as_of_date", { ascending: true });

  if (from) query = query.gte("as_of_date", from);
  if (to) query = query.lte("as_of_date", to);

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error, "net_worth_snapshots")) {
      return NextResponse.json({ snapshots: [] });
    }
    return NextResponse.json(
      {
        error:
          "Failed to fetch net worth history (is the 20260726000001_net_worth_snapshots migration applied?)",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ snapshots: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await createRequestClient(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = snapshotSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid snapshot payload" },
      { status: 400 }
    );
  }

  const values = parsed.data;

  // Reject a date the server has not reached yet, mirroring the guard in
  // /api/balance-checkpoints. Tomorrow is allowed for timezone slack.
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (values.as_of_date > tomorrow.toISOString().slice(0, 10)) {
    return NextResponse.json(
      { error: "Snapshot date is in the future" },
      { status: 400 }
    );
  }

  const accountsAndCash = roundToCents(values.accounts_and_cash);
  const savings = roundToCents(values.savings);
  const investments = roundToCents(values.investments);
  const moneyLent = roundToCents(values.money_lent);
  const debts = roundToCents(values.debts);

  const totalAssets = roundToCents(
    accountsAndCash + savings + investments + moneyLent
  );
  const netWorth = roundToCents(totalAssets - debts);

  const { data, error } = await supabase
    .from("net_worth_snapshots")
    .upsert(
      {
        user_id: user.id,
        as_of_date: values.as_of_date,
        base_currency: values.base_currency,
        total_assets: totalAssets,
        total_liabilities: debts,
        net_worth: netWorth,
        breakdown: {
          accountsAndCash,
          savings,
          investments,
          moneyLent,
          debts,
        },
      },
      { onConflict: "user_id,as_of_date" }
    )
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error, "net_worth_snapshots")) {
      return NextResponse.json(
        { error: "Net worth history is not available yet" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Unable to record snapshot", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ snapshot: data }, { status: 201 });
}
