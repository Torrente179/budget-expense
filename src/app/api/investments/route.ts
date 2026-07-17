import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeBrokerName,
  normalizeInvestmentAsset,
} from "@/lib/investments";
import { createRequestClient } from "@/lib/supabase/request";
import {
  createServiceRoleClient,
  resolveServiceRoleUserByEmail,
} from "@/lib/supabase/service-role";
import type { Database } from "@/types/database";
import {
  brokerageAccountSchema,
  investmentCashMovementSchema,
  investmentSavingsAccountSchema,
  investmentSavingsTransferSchema,
  investmentTradeSchema,
  investmentWatchlistSchema,
} from "@/lib/validations";

export const dynamic = "force-dynamic";

type SupabaseClient = Awaited<
  ReturnType<typeof createRequestClient>
>["supabase"];
type BrokerageAccountRow =
  Database["public"]["Tables"]["brokerage_accounts"]["Row"];
type InvestmentAssetRow =
  Database["public"]["Tables"]["investment_assets"]["Row"];
type LightweightTradeRow = Pick<
  Database["public"]["Tables"]["investment_trades"]["Row"],
  "id" | "side" | "quantity"
>;

const createMutationSchema = z.discriminatedUnion("resource", [
  z.object({
    resource: z.literal("brokerageAccount"),
    values: brokerageAccountSchema,
  }),
  z.object({
    resource: z.literal("trade"),
    values: investmentTradeSchema,
  }),
  z.object({
    resource: z.literal("cashMovement"),
    values: investmentCashMovementSchema,
  }),
  z.object({
    resource: z.literal("watchlist"),
    values: investmentWatchlistSchema,
  }),
  z.object({
    resource: z.literal("savingsAccount"),
    values: investmentSavingsAccountSchema,
  }),
  z.object({
    resource: z.literal("savingsTransfer"),
    values: investmentSavingsTransferSchema,
  }),
]);

const updateMutationSchema = z.discriminatedUnion("resource", [
  z.object({
    resource: z.literal("brokerageAccount"),
    id: z.string().uuid(),
    values: brokerageAccountSchema.partial(),
  }),
  z.object({
    resource: z.literal("trade"),
    id: z.string().uuid(),
    values: investmentTradeSchema,
  }),
  z.object({
    resource: z.literal("cashMovement"),
    id: z.string().uuid(),
    values: investmentCashMovementSchema,
  }),
  z.object({
    resource: z.literal("savingsAccount"),
    id: z.string().uuid(),
    values: investmentSavingsAccountSchema.partial(),
  }),
  z.object({
    resource: z.literal("savingsTransfer"),
    id: z.string().uuid(),
    values: investmentSavingsTransferSchema,
  }),
]);

const deleteMutationSchema = z.object({
  resource: z.enum([
    "brokerageAccount",
    "trade",
    "cashMovement",
    "watchlist",
    "savingsAccount",
    "savingsTransfer",
  ]),
  id: z.string().uuid(),
});

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function resolveInvestmentContext(request: NextRequest) {
  const { supabase: appSupabase, user } = await createRequestClient(request);

  if (!user) {
    return null;
  }

  const ledgerSupabase = createServiceRoleClient();
  const ledgerUser = ledgerSupabase
    ? await resolveServiceRoleUserByEmail(user.email)
    : null;

  return {
    supabase: ledgerSupabase ?? appSupabase,
    userId: ledgerUser?.id ?? user.id,
  };
}

function requireData<T>(
  result: { data: T | null; error: { message: string } | null },
  label: string
) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  if (result.data === null) {
    throw new Error(`${label}: no data returned`);
  }

  return result.data;
}

async function fetchInvestmentSnapshot(supabase: SupabaseClient, userId: string) {
  const [
    accountsResult,
    assetsResult,
    tradesResult,
    cashMovementsResult,
    savingsAccountsResult,
    savingsTransfersResult,
    watchlistResult,
  ] = await Promise.all([
    supabase
      .from("brokerage_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("investment_assets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    // Cap ledger history so PostgREST never silently truncates at 1000 with an
    // unbounded select. Positions are derived from this window.
    supabase
      .from("investment_trades")
      .select("*, brokerage_accounts(*), investment_assets(*)")
      .eq("user_id", userId)
      .order("trade_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1500),
    supabase
      .from("investment_cash_movements")
      .select("*, brokerage_accounts(*)")
      .eq("user_id", userId)
      .order("movement_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1500),
    supabase
      .from("investment_savings_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("investment_savings_transfers")
      .select("*, investment_savings_accounts(*)")
      .eq("user_id", userId)
      .order("transfer_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1500),
    supabase
      .from("investment_watchlist")
      .select("*, investment_assets(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    accounts: requireData(accountsResult, "Failed to fetch brokerage accounts"),
    assets: requireData(assetsResult, "Failed to fetch investment assets"),
    trades: requireData(tradesResult, "Failed to fetch investment trades"),
    cashMovements: requireData(
      cashMovementsResult,
      "Failed to fetch investment cash movements"
    ),
    savingsAccounts: requireData(
      savingsAccountsResult,
      "Failed to fetch investment savings accounts"
    ),
    savingsTransfers: requireData(
      savingsTransfersResult,
      "Failed to fetch investment savings transfers"
    ),
    watchlist: requireData(watchlistResult, "Failed to fetch investment watchlist"),
  };
}

async function findBrokerageAccount(
  supabase: SupabaseClient,
  userId: string,
  options: {
    accountId?: string;
    brokerName?: string;
  }
) {
  if (options.accountId) {
    const directResult = await supabase
      .from("brokerage_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("id", options.accountId)
      .maybeSingle();

    if (directResult.error) {
      throw new Error(`Failed to load brokerage account: ${directResult.error.message}`);
    }

    if (directResult.data) {
      return directResult.data as BrokerageAccountRow;
    }
  }

  if (!options.brokerName) {
    return null;
  }

  const accountsResult = await supabase
    .from("brokerage_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const accounts = requireData(
    accountsResult,
    "Failed to search brokerage accounts"
  ) as BrokerageAccountRow[];
  const normalizedBroker = normalizeBrokerName(options.brokerName).toLowerCase();

  return (
    accounts.find(
      (account) =>
        normalizeBrokerName(account.broker_kind).toLowerCase() === normalizedBroker
    ) ??
    accounts.find(
      (account) =>
        normalizeBrokerName(account.name).toLowerCase() === normalizedBroker
    ) ??
    null
  );
}

async function ensureBrokerageAccount(
  supabase: SupabaseClient,
  userId: string,
  options: {
    accountId?: string;
    brokerName: string;
    accountCurrency: string;
    feeCurrency: string;
  }
) {
  const existing = await findBrokerageAccount(supabase, userId, {
    accountId: options.accountId,
    brokerName: options.brokerName,
  });

  if (existing) {
    return existing;
  }

  const brokerLabel = normalizeBrokerName(options.brokerName);
  const result = await supabase
    .from("brokerage_accounts")
    .insert({
      user_id: userId,
      broker_kind: brokerLabel,
      name: brokerLabel,
      account_currency: options.accountCurrency,
      fee_mode: "manual",
      fee_percent: 0,
      fee_fixed_amount: 0,
      fee_min_amount: 0,
      fee_currency: options.feeCurrency,
    })
    .select("*")
    .single();

  return requireData(result, "Failed to save brokerage account") as BrokerageAccountRow;
}

async function upsertAsset(
  supabase: SupabaseClient,
  userId: string,
  assetInput: z.infer<typeof investmentTradeSchema>["asset"]
) {
  const normalized = normalizeInvestmentAsset(assetInput);
  const result = await supabase
    .from("investment_assets")
    .upsert(
      {
        user_id: userId,
        ...normalized,
      },
      { onConflict: "user_id,asset_key" }
    )
    .select("*")
    .single();

  return requireData(result, "Failed to save investment asset") as InvestmentAssetRow;
}

async function assertSellQuantityAvailable(
  supabase: SupabaseClient,
  userId: string,
  options: {
    assetId: string;
    accountId: string;
    quantity: number;
    excludeTradeId?: string;
  }
) {
  const tradesResult = await supabase
    .from("investment_trades")
    .select("id, side, quantity")
    .eq("user_id", userId)
    .eq("asset_id", options.assetId)
    .eq("account_id", options.accountId);

  const trades = requireData(
    tradesResult,
    "Failed to validate sell quantity"
  ) as LightweightTradeRow[];

  const availableQuantity = trades.reduce((sum, trade) => {
    if (trade.id === options.excludeTradeId) {
      return sum;
    }

    const signedQuantity =
      trade.side === "buy" ? Number(trade.quantity) : -Number(trade.quantity);

    return sum + signedQuantity;
  }, 0);

  if (options.quantity > availableQuantity) {
    throw new Error("Sell quantity exceeds the current position");
  }
}

async function createTrade(
  supabase: SupabaseClient,
  userId: string,
  values: z.infer<typeof investmentTradeSchema>
) {
  const brokerageAccount = await ensureBrokerageAccount(supabase, userId, {
    accountId: values.account_id || undefined,
    brokerName: values.broker_name,
    accountCurrency: values.execution_currency,
    feeCurrency: values.fee_currency,
  });
  const asset = await upsertAsset(supabase, userId, values.asset);

  if (values.side === "sell") {
    await assertSellQuantityAvailable(supabase, userId, {
      assetId: asset.id,
      accountId: brokerageAccount.id,
      quantity: values.quantity,
    });
  }

  const result = await supabase.from("investment_trades").insert({
    user_id: userId,
    account_id: brokerageAccount.id,
    asset_id: asset.id,
    side: values.side,
    trade_date: values.trade_date,
    quantity: values.quantity,
    execution_price: values.execution_price,
    execution_currency: values.execution_currency,
    reference_close_price: values.reference_close_price ?? null,
    reference_close_currency: values.reference_close_currency ?? null,
    reference_price_date: values.reference_price_date ?? null,
    reference_source: values.reference_source ?? null,
    reference_status: values.reference_status,
    fee_amount: values.fee_amount,
    fee_currency: values.fee_currency,
    notes: normalizeOptionalText(values.notes),
    source_kind: "manual",
  });

  if (result.error) {
    throw new Error(`Failed to save trade: ${result.error.message}`);
  }
}

async function updateTrade(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  values: z.infer<typeof investmentTradeSchema>
) {
  const brokerageAccount = await ensureBrokerageAccount(supabase, userId, {
    accountId: values.account_id || undefined,
    brokerName: values.broker_name,
    accountCurrency: values.execution_currency,
    feeCurrency: values.fee_currency,
  });
  const asset = await upsertAsset(supabase, userId, values.asset);

  if (values.side === "sell") {
    await assertSellQuantityAvailable(supabase, userId, {
      assetId: asset.id,
      accountId: brokerageAccount.id,
      quantity: values.quantity,
      excludeTradeId: id,
    });
  }

  const result = await supabase
    .from("investment_trades")
    .update({
      account_id: brokerageAccount.id,
      asset_id: asset.id,
      side: values.side,
      trade_date: values.trade_date,
      quantity: values.quantity,
      execution_price: values.execution_price,
      execution_currency: values.execution_currency,
      reference_close_price: values.reference_close_price ?? null,
      reference_close_currency: values.reference_close_currency ?? null,
      reference_price_date: values.reference_price_date ?? null,
      reference_source: values.reference_source ?? null,
      reference_status: values.reference_status,
      fee_amount: values.fee_amount,
      fee_currency: values.fee_currency,
      notes: normalizeOptionalText(values.notes),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (result.error) {
    throw new Error(`Failed to update trade: ${result.error.message}`);
  }
}

async function createCashMovement(
  supabase: SupabaseClient,
  userId: string,
  values: z.infer<typeof investmentCashMovementSchema>
) {
  const brokerageAccount = await ensureBrokerageAccount(supabase, userId, {
    accountId: values.account_id || undefined,
    brokerName: values.broker_name,
    accountCurrency: values.currency,
    feeCurrency: values.fee_currency,
  });

  const result = await supabase.from("investment_cash_movements").insert({
    user_id: userId,
    account_id: brokerageAccount.id,
    movement_type: values.movement_type,
    movement_date: values.movement_date,
    amount: values.amount,
    currency: values.currency,
    fee_amount: values.fee_amount,
    fee_currency: values.fee_currency,
    notes: normalizeOptionalText(values.notes),
    source_kind: "manual",
  });

  if (result.error) {
    throw new Error(`Failed to save cash movement: ${result.error.message}`);
  }
}

async function updateCashMovement(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  values: z.infer<typeof investmentCashMovementSchema>
) {
  const brokerageAccount = await ensureBrokerageAccount(supabase, userId, {
    accountId: values.account_id || undefined,
    brokerName: values.broker_name,
    accountCurrency: values.currency,
    feeCurrency: values.fee_currency,
  });

  const result = await supabase
    .from("investment_cash_movements")
    .update({
      account_id: brokerageAccount.id,
      movement_type: values.movement_type,
      movement_date: values.movement_date,
      amount: values.amount,
      currency: values.currency,
      fee_amount: values.fee_amount,
      fee_currency: values.fee_currency,
      notes: normalizeOptionalText(values.notes),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (result.error) {
    throw new Error(`Failed to update cash movement: ${result.error.message}`);
  }
}

async function createWatchlistItem(
  supabase: SupabaseClient,
  userId: string,
  values: z.infer<typeof investmentWatchlistSchema>
) {
  const asset = await upsertAsset(supabase, userId, values.asset);
  const result = await supabase.from("investment_watchlist").upsert(
    {
      user_id: userId,
      asset_id: asset.id,
      note: normalizeOptionalText(values.note),
    },
    { onConflict: "user_id,asset_id" }
  );

  if (result.error) {
    throw new Error(`Failed to save watchlist item: ${result.error.message}`);
  }
}

export async function GET(request: NextRequest) {
  const context = await resolveInvestmentContext(request);

  if (!context) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const snapshot = await fetchInvestmentSnapshot(
      context.supabase,
      context.userId
    );
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Failed to fetch investments", error);
    return jsonError("Unable to fetch investments", 500);
  }
}

export async function POST(request: NextRequest) {
  const parsed = createMutationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError("Invalid investment payload", 400);
  }

  const context = await resolveInvestmentContext(request);

  if (!context) {
    return jsonError("Unauthorized", 401);
  }

  try {
    switch (parsed.data.resource) {
      case "brokerageAccount": {
        const result = await context.supabase.from("brokerage_accounts").insert({
          ...parsed.data.values,
          user_id: context.userId,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }
        break;
      }
      case "trade":
        await createTrade(context.supabase, context.userId, parsed.data.values);
        break;
      case "cashMovement":
        await createCashMovement(
          context.supabase,
          context.userId,
          parsed.data.values
        );
        break;
      case "watchlist":
        await createWatchlistItem(
          context.supabase,
          context.userId,
          parsed.data.values
        );
        break;
      case "savingsAccount": {
        const result = await context.supabase
          .from("investment_savings_accounts")
          .insert({
            ...parsed.data.values,
            user_id: context.userId,
          });

        if (result.error) {
          throw new Error(result.error.message);
        }
        break;
      }
      case "savingsTransfer": {
        const result = await context.supabase
          .from("investment_savings_transfers")
          .insert({
            user_id: context.userId,
            savings_account_id: parsed.data.values.savings_account_id,
            transfer_date: parsed.data.values.transfer_date,
            amount: parsed.data.values.amount,
            currency: parsed.data.values.currency,
            notes: normalizeOptionalText(parsed.data.values.notes),
            source_kind: parsed.data.values.source_kind,
          });

        if (result.error) {
          throw new Error(result.error.message);
        }
        break;
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to create investment record", error);
    return jsonError(
      error instanceof Error ? error.message : "Unable to create investment record",
      500
    );
  }
}

export async function PATCH(request: NextRequest) {
  const parsed = updateMutationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError("Invalid investment update", 400);
  }

  const context = await resolveInvestmentContext(request);

  if (!context) {
    return jsonError("Unauthorized", 401);
  }

  try {
    switch (parsed.data.resource) {
      case "brokerageAccount": {
        const result = await context.supabase
          .from("brokerage_accounts")
          .update(parsed.data.values)
          .eq("id", parsed.data.id)
          .eq("user_id", context.userId);

        if (result.error) {
          throw new Error(result.error.message);
        }
        break;
      }
      case "trade":
        await updateTrade(
          context.supabase,
          context.userId,
          parsed.data.id,
          parsed.data.values
        );
        break;
      case "cashMovement":
        await updateCashMovement(
          context.supabase,
          context.userId,
          parsed.data.id,
          parsed.data.values
        );
        break;
      case "savingsAccount": {
        const result = await context.supabase
          .from("investment_savings_accounts")
          .update(parsed.data.values)
          .eq("id", parsed.data.id)
          .eq("user_id", context.userId);

        if (result.error) {
          throw new Error(result.error.message);
        }
        break;
      }
      case "savingsTransfer": {
        const result = await context.supabase
          .from("investment_savings_transfers")
          .update({
            savings_account_id: parsed.data.values.savings_account_id,
            transfer_date: parsed.data.values.transfer_date,
            amount: parsed.data.values.amount,
            currency: parsed.data.values.currency,
            notes: normalizeOptionalText(parsed.data.values.notes),
            source_kind: parsed.data.values.source_kind,
          })
          .eq("id", parsed.data.id)
          .eq("user_id", context.userId);

        if (result.error) {
          throw new Error(result.error.message);
        }
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update investment record", error);
    return jsonError(
      error instanceof Error ? error.message : "Unable to update investment record",
      500
    );
  }
}

export async function DELETE(request: NextRequest) {
  const parsed = deleteMutationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError("Invalid investment delete payload", 400);
  }

  const context = await resolveInvestmentContext(request);

  if (!context) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const table =
      parsed.data.resource === "brokerageAccount"
        ? "brokerage_accounts"
        : parsed.data.resource === "trade"
          ? "investment_trades"
          : parsed.data.resource === "cashMovement"
            ? "investment_cash_movements"
            : parsed.data.resource === "watchlist"
              ? "investment_watchlist"
              : parsed.data.resource === "savingsAccount"
                ? "investment_savings_accounts"
                : "investment_savings_transfers";

    const result = await context.supabase
      .from(table)
      .delete()
      .eq("id", parsed.data.id)
      .eq("user_id", context.userId);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete investment record", error);
    return jsonError(
      error instanceof Error ? error.message : "Unable to delete investment record",
      500
    );
  }
}
