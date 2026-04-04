"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { resolveOptionalTableResult } from "@/lib/supabase/postgrest-errors";
import { useCurrency } from "@/providers/currency-provider";
import {
  normalizeBrokerName,
  buildInvestmentOverview,
  normalizeInvestmentAsset,
  type InvestmentAssetRow,
  type InvestmentCashMovementWithJoins,
  type InvestmentSavingsAccountRow,
  type InvestmentSavingsTransferWithJoins,
  type InvestmentTradeWithJoins,
  type InvestmentWatchlistWithJoins,
  type LatestQuote,
} from "@/lib/investments";
import type {
  BrokerageAccountFormValues,
  InvestmentAssetFormValues,
  InvestmentCashMovementFormValues,
  InvestmentSavingsAccountFormValues,
  InvestmentSavingsTransferFormValues,
  InvestmentTradeFormValues,
  InvestmentWatchlistFormValues,
} from "@/lib/validations";

type BrokerageAccount = {
  id: string;
  user_id: string;
  broker_kind: string;
  name: string;
  account_currency: string;
  fee_mode: string;
  fee_percent: number;
  fee_fixed_amount: number;
  fee_min_amount: number;
  fee_currency: string;
  created_at: string;
  updated_at: string;
};

function buildLatestQuoteMap(quotes: LatestQuote[]) {
  return quotes.reduce<Record<string, LatestQuote>>((accumulator, quote) => {
    accumulator[quote.assetKey] = quote;
    return accumulator;
  }, {});
}

function getNetQuantityForAsset(
  trades: InvestmentTradeWithJoins[],
  assetId: string,
  accountId?: string,
  excludeTradeId?: string
) {
  return trades.reduce((sum, trade) => {
    if (
      trade.asset_id !== assetId ||
      trade.id === excludeTradeId ||
      (accountId && trade.account_id !== accountId)
    ) {
      return sum;
    }

    const signedQuantity =
      trade.side === "buy" ? Number(trade.quantity) : -Number(trade.quantity);
    return sum + signedQuantity;
  }, 0);
}

function findMatchingBrokerAccount(
  accounts: BrokerageAccount[],
  options: {
    accountId?: string;
    brokerName?: string;
  }
) {
  if (options.accountId) {
    const directMatch = accounts.find((account) => account.id === options.accountId);
    if (directMatch) {
      return directMatch;
    }
  }

  if (!options.brokerName) {
    return null;
  }

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

export function useInvestments() {
  const [accounts, setAccounts] = useState<BrokerageAccount[]>([]);
  const [assets, setAssets] = useState<InvestmentAssetRow[]>([]);
  const [trades, setTrades] = useState<InvestmentTradeWithJoins[]>([]);
  const [cashMovements, setCashMovements] = useState<
    InvestmentCashMovementWithJoins[]
  >([]);
  const [savingsAccounts, setSavingsAccounts] = useState<
    InvestmentSavingsAccountRow[]
  >([]);
  const [savingsTransfers, setSavingsTransfers] = useState<
    InvestmentSavingsTransferWithJoins[]
  >([]);
  const [watchlist, setWatchlist] = useState<InvestmentWatchlistWithJoins[]>([]);
  const [latestQuotes, setLatestQuotes] = useState<Record<string, LatestQuote>>({});
  const [loading, setLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const supabase = createClient();
  const { convert } = useCurrency();

  const overview = buildInvestmentOverview({
    trades,
    cashMovements,
    watchlist,
    latestQuotes,
    convert,
  });
  const savingsAccountSummaries = savingsAccounts
    .map((account) => {
      const balance = savingsTransfers
        .filter((transfer) => transfer.savings_account_id === account.id)
        .reduce(
          (sum, transfer) =>
            sum + convert(Number(transfer.amount), transfer.currency),
          0
        );

      return {
        ...account,
        balance,
      };
    })
    .sort((left, right) => right.balance - left.balance);

  const totalSavingsBalance = savingsAccountSummaries.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  const fetchMarketPrices = useCallback(
    async (targetAssets: InvestmentAssetRow[]) => {
      if (targetAssets.length === 0) {
        setLatestQuotes({});
        return;
      }

      setQuoteLoading(true);
      const quotes = await Promise.all(
        targetAssets.map(async (asset) => {
          const params = new URLSearchParams({
            symbol: asset.symbol,
            assetType: asset.asset_type,
            marketCode: asset.market_code,
          });

          if (asset.exchange_code) {
            params.set("exchangeCode", asset.exchange_code);
          }
          if (asset.provider_symbol_twelve) {
            params.set("providerSymbolTwelve", asset.provider_symbol_twelve);
          }
          if (asset.provider_symbol_eodhd) {
            params.set("providerSymbolEodhd", asset.provider_symbol_eodhd);
          }

          try {
            const response = await fetch(`/api/market-prices?${params.toString()}`);
            if (!response.ok) {
              return null;
            }

            const data = (await response.json()) as Omit<LatestQuote, "assetKey">;
            return {
              ...data,
              assetKey: asset.asset_key,
            } as LatestQuote;
          } catch {
            return null;
          }
        })
      );

      setLatestQuotes(
        buildLatestQuoteMap(
          quotes.filter((quote): quote is LatestQuote => quote !== null)
        )
      );
      setQuoteLoading(false);
    },
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
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
          .order("created_at", { ascending: true }),
        supabase
          .from("investment_assets")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("investment_trades")
          .select("*, brokerage_accounts(*), investment_assets(*)")
          .order("trade_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("investment_cash_movements")
          .select("*, brokerage_accounts(*)")
          .order("movement_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("investment_savings_accounts")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("investment_savings_transfers")
          .select("*, investment_savings_accounts(*)")
          .order("transfer_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("investment_watchlist")
          .select("*, investment_assets(*)")
          .order("created_at", { ascending: false }),
      ]);

      const accounts = resolveOptionalTableResult(accountsResult, {
        table: "brokerage_accounts",
        context: "Brokerage accounts table is unavailable during fetch",
        fallback: [],
      });
      const assets = resolveOptionalTableResult(assetsResult, {
        table: "investment_assets",
        context: "Investment assets table is unavailable during fetch",
        fallback: [],
      });
      const trades = resolveOptionalTableResult(tradesResult, {
        table: "investment_trades",
        context: "Investment trades table is unavailable during fetch",
        fallback: [],
      });
      const cashMovements = resolveOptionalTableResult(cashMovementsResult, {
        table: "investment_cash_movements",
        context: "Investment cash movements table is unavailable during fetch",
        fallback: [],
      });
      const savingsAccounts = resolveOptionalTableResult(savingsAccountsResult, {
        table: "investment_savings_accounts",
        context: "Investment savings accounts table is unavailable during fetch",
        fallback: [],
      });
      const savingsTransfers = resolveOptionalTableResult(savingsTransfersResult, {
        table: "investment_savings_transfers",
        context: "Investment savings transfers table is unavailable during fetch",
        fallback: [],
      });
      const watchlist = resolveOptionalTableResult(watchlistResult, {
        table: "investment_watchlist",
        context: "Investment watchlist table is unavailable during fetch",
        fallback: [],
      });

      setAccounts(accounts as BrokerageAccount[]);
      setAssets(assets as InvestmentAssetRow[]);
      setTrades(trades as InvestmentTradeWithJoins[]);
      setCashMovements(cashMovements as InvestmentCashMovementWithJoins[]);
      setSavingsAccounts(savingsAccounts as InvestmentSavingsAccountRow[]);
      setSavingsTransfers(savingsTransfers as InvestmentSavingsTransferWithJoins[]);
      setWatchlist(watchlist as InvestmentWatchlistWithJoins[]);
    } catch (error) {
      console.error("Failed to fetch investments data", error);
      setAccounts([]);
      setAssets([]);
      setTrades([]);
      setCashMovements([]);
      setSavingsAccounts([]);
      setSavingsTransfers([]);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const assetMap = new Map<string, InvestmentAssetRow>();
    assets.forEach((asset) => {
      assetMap.set(asset.id, asset);
    });
    watchlist.forEach((item) => {
      assetMap.set(item.investment_assets.id, item.investment_assets);
    });
    trades.forEach((trade) => {
      assetMap.set(trade.investment_assets.id, trade.investment_assets);
    });

    void fetchMarketPrices(Array.from(assetMap.values()));
  }, [assets, trades, watchlist, fetchMarketPrices]);

  const getUserId = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  }, [supabase]);

  const ensureBrokerageAccount = useCallback(
    async ({
      userId,
      accountId,
      brokerName,
      accountCurrency,
      feeCurrency,
    }: {
      userId: string;
      accountId?: string;
      brokerName: string;
      accountCurrency: string;
      feeCurrency: string;
    }) => {
      const existing = findMatchingBrokerAccount(accounts, {
        accountId,
        brokerName,
      });

      if (existing) {
        return existing;
      }

      const brokerLabel = normalizeBrokerName(brokerName);
      const { data: remoteExisting } = await supabase
        .from("brokerage_accounts")
        .select("*")
        .eq("user_id", userId)
        .eq("broker_kind", brokerLabel)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (remoteExisting) {
        return remoteExisting as BrokerageAccount;
      }

      const { data, error } = await supabase
        .from("brokerage_accounts")
        .insert({
          user_id: userId,
          broker_kind: brokerLabel,
          name: brokerLabel,
          account_currency: accountCurrency,
          fee_mode: "manual",
          fee_percent: 0,
          fee_fixed_amount: 0,
          fee_min_amount: 0,
          fee_currency: feeCurrency,
        })
        .select("*")
        .single();

      if (error) {
        toast.error("Failed to save broker selection");
        return null;
      }

      return data as BrokerageAccount;
    },
    [accounts, supabase]
  );

  const upsertAsset = useCallback(
    async (assetInput: InvestmentAssetFormValues) => {
      const userId = await getUserId();
      if (!userId) return null;

      const normalized = normalizeInvestmentAsset(assetInput);
      const { data, error } = await supabase
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

      if (error) {
        toast.error("Unable to save asset details");
        return null;
      }

      return data as InvestmentAssetRow;
    },
    [getUserId, supabase]
  );

  const lookupMarketPrice = useCallback(
    async ({
      asset,
      date,
    }: {
      asset: InvestmentAssetFormValues;
      date?: string;
    }) => {
      const normalized = normalizeInvestmentAsset(asset);
      const params = new URLSearchParams({
        symbol: normalized.symbol,
        assetType: normalized.asset_type,
        marketCode: normalized.market_code,
      });

      if (date) {
        params.set("date", date);
      }

      if (normalized.exchange_code) {
        params.set("exchangeCode", normalized.exchange_code);
      }
      if (normalized.provider_symbol_twelve) {
        params.set("providerSymbolTwelve", normalized.provider_symbol_twelve);
      }
      if (normalized.provider_symbol_eodhd) {
        params.set("providerSymbolEodhd", normalized.provider_symbol_eodhd);
      }

      const response = await fetch(`/api/market-prices?${params.toString()}`);
      if (!response.ok) {
        return null;
      }

      return (await response.json()) as Omit<LatestQuote, "assetKey">;
    },
    []
  );

  async function addBrokerageAccount(values: BrokerageAccountFormValues) {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase.from("brokerage_accounts").insert({
      ...values,
      user_id: userId,
    });

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to add brokerage account");
    return error;
  }

  async function updateBrokerageAccount(
    id: string,
    values: Partial<BrokerageAccountFormValues>
  ) {
    const { error } = await supabase
      .from("brokerage_accounts")
      .update(values)
      .eq("id", id);

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to update brokerage account");
    return error;
  }

  async function deleteBrokerageAccount(id: string) {
    const { error } = await supabase
      .from("brokerage_accounts")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to delete brokerage account");
    return error;
  }

  async function addTrade(values: InvestmentTradeFormValues) {
    const userId = await getUserId();
    if (!userId) return;

    const brokerageAccount = await ensureBrokerageAccount({
      userId,
      accountId: values.account_id || undefined,
      brokerName: values.broker_name,
      accountCurrency: values.execution_currency,
      feeCurrency: values.fee_currency,
    });
    if (!brokerageAccount) {
      return new Error("Broker could not be saved");
    }

    const asset = await upsertAsset(values.asset);
    if (!asset) {
      return new Error("Asset could not be saved");
    }

    if (values.side === "sell") {
      const availableQuantity = getNetQuantityForAsset(
        trades,
        asset.id,
        brokerageAccount.id
      );
      if (values.quantity > availableQuantity) {
        toast.error("Sell quantity exceeds the current position");
        return new Error("Insufficient quantity");
      }
    }

    const { error } = await supabase.from("investment_trades").insert({
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
      notes: values.notes ?? null,
      source_kind: "manual",
    });

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to save trade");
    return error;
  }

  async function updateTrade(id: string, values: InvestmentTradeFormValues) {
    const userId = await getUserId();
    if (!userId) return;

    const brokerageAccount = await ensureBrokerageAccount({
      userId,
      accountId: values.account_id || undefined,
      brokerName: values.broker_name,
      accountCurrency: values.execution_currency,
      feeCurrency: values.fee_currency,
    });
    if (!brokerageAccount) {
      return new Error("Broker could not be saved");
    }

    const asset = await upsertAsset(values.asset);
    if (!asset) {
      return new Error("Asset could not be saved");
    }

    if (values.side === "sell") {
      const availableQuantity = getNetQuantityForAsset(
        trades,
        asset.id,
        brokerageAccount.id,
        id
      );
      if (values.quantity > availableQuantity) {
        toast.error("Sell quantity exceeds the current position");
        return new Error("Insufficient quantity");
      }
    }

    const { error } = await supabase
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
        notes: values.notes ?? null,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to update trade");
    return error;
  }

  async function deleteTrade(id: string) {
    const { error } = await supabase
      .from("investment_trades")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to delete trade");
    return error;
  }

  async function addCashMovement(values: InvestmentCashMovementFormValues) {
    const userId = await getUserId();
    if (!userId) return;

    const brokerageAccount = await ensureBrokerageAccount({
      userId,
      accountId: values.account_id || undefined,
      brokerName: values.broker_name,
      accountCurrency: values.currency,
      feeCurrency: values.fee_currency,
    });
    if (!brokerageAccount) {
      return new Error("Broker could not be saved");
    }

    const { error } = await supabase.from("investment_cash_movements").insert({
      user_id: userId,
      account_id: brokerageAccount.id,
      movement_type: values.movement_type,
      movement_date: values.movement_date,
      amount: values.amount,
      currency: values.currency,
      fee_amount: values.fee_amount,
      fee_currency: values.fee_currency,
      notes: values.notes ?? null,
      source_kind: "manual",
    });

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to save cash movement");
    return error;
  }

  async function updateCashMovement(
    id: string,
    values: InvestmentCashMovementFormValues
  ) {
    const userId = await getUserId();
    if (!userId) return;

    const brokerageAccount = await ensureBrokerageAccount({
      userId,
      accountId: values.account_id || undefined,
      brokerName: values.broker_name,
      accountCurrency: values.currency,
      feeCurrency: values.fee_currency,
    });
    if (!brokerageAccount) {
      return new Error("Broker could not be saved");
    }

    const { error } = await supabase
      .from("investment_cash_movements")
      .update({
        account_id: brokerageAccount.id,
        movement_type: values.movement_type,
        movement_date: values.movement_date,
        amount: values.amount,
        currency: values.currency,
        fee_amount: values.fee_amount,
        fee_currency: values.fee_currency,
        notes: values.notes ?? null,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to update cash movement");
    return error;
  }

  async function deleteCashMovement(id: string) {
    const { error } = await supabase
      .from("investment_cash_movements")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to delete cash movement");
    return error;
  }

  async function addWatchlistItem(values: InvestmentWatchlistFormValues) {
    const userId = await getUserId();
    if (!userId) return;

    const asset = await upsertAsset(values.asset);
    if (!asset) {
      return new Error("Asset could not be saved");
    }

    const { error } = await supabase.from("investment_watchlist").upsert(
      {
        user_id: userId,
        asset_id: asset.id,
        note: values.note ?? null,
      },
      { onConflict: "user_id,asset_id" }
    );

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to save watchlist item");
    return error;
  }

  async function deleteWatchlistItem(id: string) {
    const { error } = await supabase
      .from("investment_watchlist")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to delete watchlist item");
    return error;
  }

  async function addSavingsAccount(values: InvestmentSavingsAccountFormValues) {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase.from("investment_savings_accounts").insert({
      ...values,
      user_id: userId,
    });

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to save savings account");
    return error;
  }

  async function updateSavingsAccount(
    id: string,
    values: Partial<InvestmentSavingsAccountFormValues>
  ) {
    const { error } = await supabase
      .from("investment_savings_accounts")
      .update(values)
      .eq("id", id);

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to update savings account");
    return error;
  }

  async function deleteSavingsAccount(id: string) {
    const { error } = await supabase
      .from("investment_savings_accounts")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to delete savings account");
    return error;
  }

  async function addSavingsTransfer(values: InvestmentSavingsTransferFormValues) {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase.from("investment_savings_transfers").insert({
      user_id: userId,
      savings_account_id: values.savings_account_id,
      transfer_date: values.transfer_date,
      amount: values.amount,
      currency: values.currency,
      notes: values.notes ?? null,
      source_kind: values.source_kind,
    });

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to save savings transfer");
    return error;
  }

  async function updateSavingsTransfer(
    id: string,
    values: InvestmentSavingsTransferFormValues
  ) {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase
      .from("investment_savings_transfers")
      .update({
        savings_account_id: values.savings_account_id,
        transfer_date: values.transfer_date,
        amount: values.amount,
        currency: values.currency,
        notes: values.notes ?? null,
        source_kind: values.source_kind,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to update savings transfer");
    return error;
  }

  async function deleteSavingsTransfer(id: string) {
    const { error } = await supabase
      .from("investment_savings_transfers")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchData();
      return null;
    }

    toast.error("Failed to delete savings transfer");
    return error;
  }

  return {
    accounts,
    assets,
    trades,
    cashMovements,
    savingsAccounts,
    savingsTransfers,
    savingsAccountSummaries,
    totalSavingsBalance,
    watchlist,
    latestQuotes,
    overview,
    loading,
    quoteLoading,
    refetch: fetchData,
    lookupMarketPrice,
    addBrokerageAccount,
    updateBrokerageAccount,
    deleteBrokerageAccount,
    addTrade,
    updateTrade,
    deleteTrade,
    addCashMovement,
    updateCashMovement,
    deleteCashMovement,
    addSavingsAccount,
    updateSavingsAccount,
    deleteSavingsAccount,
    addSavingsTransfer,
    updateSavingsTransfer,
    deleteSavingsTransfer,
    addWatchlistItem,
    deleteWatchlistItem,
  };
}
