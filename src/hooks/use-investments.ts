"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useCurrency } from "@/providers/currency-provider";
import {
  buildInvestmentOverview,
  normalizeInvestmentAsset,
  type BrokerageAccountRow,
  type InvestmentAssetRow,
  type InvestmentCashMovementWithJoins,
  type InvestmentSavingsAccountRow,
  type InvestmentSavingsTransferWithJoins,
  type InvestmentTradeWithJoins,
  type InvestmentWatchlistWithJoins,
  type LatestQuote,
} from "@/lib/investments";
import {
  fetchInvestmentSnapshot,
  requestInvestmentMutation,
} from "@/lib/investments-api-client";
import type {
  BrokerageAccountFormValues,
  InvestmentAssetFormValues,
  InvestmentCashMovementFormValues,
  InvestmentSavingsAccountFormValues,
  InvestmentSavingsTransferFormValues,
  InvestmentTradeFormValues,
  InvestmentWatchlistFormValues,
} from "@/lib/validations";

type TradeWithOptionalJoins = Omit<
  InvestmentTradeWithJoins,
  "brokerage_accounts" | "investment_assets"
> & {
  brokerage_accounts: InvestmentTradeWithJoins["brokerage_accounts"] | null;
  investment_assets: InvestmentTradeWithJoins["investment_assets"] | null;
};

type CashMovementWithOptionalJoins = Omit<
  InvestmentCashMovementWithJoins,
  "brokerage_accounts"
> & {
  brokerage_accounts: InvestmentCashMovementWithJoins["brokerage_accounts"] | null;
};

type WatchlistWithOptionalJoins = Omit<
  InvestmentWatchlistWithJoins,
  "investment_assets"
> & {
  investment_assets: InvestmentWatchlistWithJoins["investment_assets"] | null;
};

type SavingsTransferWithOptionalJoins = Omit<
  InvestmentSavingsTransferWithJoins,
  "investment_savings_accounts"
> & {
  investment_savings_accounts:
    | InvestmentSavingsTransferWithJoins["investment_savings_accounts"]
    | null;
};

function hasTradeJoins(trade: TradeWithOptionalJoins): trade is InvestmentTradeWithJoins {
  return Boolean(trade.brokerage_accounts && trade.investment_assets);
}

function hasCashMovementJoins(
  movement: CashMovementWithOptionalJoins
): movement is InvestmentCashMovementWithJoins {
  return Boolean(movement.brokerage_accounts);
}

function hasWatchlistJoins(
  item: WatchlistWithOptionalJoins
): item is InvestmentWatchlistWithJoins {
  return Boolean(item.investment_assets);
}

function hasSavingsTransferJoins(
  transfer: SavingsTransferWithOptionalJoins
): transfer is InvestmentSavingsTransferWithJoins {
  return Boolean(transfer.investment_savings_accounts);
}

function logDroppedRows(label: string, before: number, after: number) {
  if (after >= before) {
    return;
  }

  const dropped = before - after;
  console.warn(
    `[useInvestments] Ignored ${dropped} ${label} row${dropped === 1 ? "" : "s"} with missing related records`
  );
}

function buildLatestQuoteMap(quotes: LatestQuote[]) {
  return quotes.reduce<Record<string, LatestQuote>>((accumulator, quote) => {
    accumulator[quote.assetKey] = quote;
    return accumulator;
  }, {});
}

export function useInvestments() {
  const [accounts, setAccounts] = useState<BrokerageAccountRow[]>([]);
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
      try {
        const response = await fetch("/api/market-prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assets: targetAssets.map((asset) => ({
              assetKey: asset.asset_key,
              symbol: asset.symbol,
              assetType: asset.asset_type,
              marketCode: asset.market_code,
              exchangeCode: asset.exchange_code ?? undefined,
              providerSymbolTwelve: asset.provider_symbol_twelve ?? undefined,
              providerSymbolEodhd: asset.provider_symbol_eodhd ?? undefined,
            })),
          }),
        });

        if (!response.ok) {
          setLatestQuotes({});
          return;
        }

        const data = (await response.json()) as { quotes?: LatestQuote[] };
        setLatestQuotes(buildLatestQuoteMap(data.quotes ?? []));
      } catch {
        setLatestQuotes({});
      } finally {
        setQuoteLoading(false);
      }
    },
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await fetchInvestmentSnapshot();
      const {
        accounts,
        assets,
        trades,
        cashMovements,
        savingsAccounts,
        savingsTransfers,
        watchlist,
      } = snapshot;

      const normalizedTrades = (trades as TradeWithOptionalJoins[]).filter(hasTradeJoins);
      const normalizedCashMovements = (cashMovements as CashMovementWithOptionalJoins[])
        .filter(hasCashMovementJoins);
      const normalizedSavingsTransfers = (
        savingsTransfers as SavingsTransferWithOptionalJoins[]
      ).filter(hasSavingsTransferJoins);
      const normalizedWatchlist = (watchlist as WatchlistWithOptionalJoins[]).filter(
        hasWatchlistJoins
      );

      logDroppedRows(
        "trade",
        (trades as TradeWithOptionalJoins[]).length,
        normalizedTrades.length
      );
      logDroppedRows(
        "cash movement",
        (cashMovements as CashMovementWithOptionalJoins[]).length,
        normalizedCashMovements.length
      );
      logDroppedRows(
        "savings transfer",
        (savingsTransfers as SavingsTransferWithOptionalJoins[]).length,
        normalizedSavingsTransfers.length
      );
      logDroppedRows(
        "watchlist",
        (watchlist as WatchlistWithOptionalJoins[]).length,
        normalizedWatchlist.length
      );

      setAccounts(accounts as BrokerageAccountRow[]);
      setAssets(assets as InvestmentAssetRow[]);
      setTrades(normalizedTrades);
      setCashMovements(normalizedCashMovements);
      setSavingsAccounts(savingsAccounts as InvestmentSavingsAccountRow[]);
      setSavingsTransfers(normalizedSavingsTransfers);
      setWatchlist(normalizedWatchlist);
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
  }, []);

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

  async function runMutation(
    method: "POST" | "PATCH" | "DELETE",
    body: unknown,
    errorMessage: string
  ) {
    try {
      await requestInvestmentMutation(method, body);
      await fetchData();
      return null;
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.length > 0
          ? error.message
          : errorMessage
      );
      return error instanceof Error ? error : new Error(errorMessage);
    }
  }

  async function addBrokerageAccount(values: BrokerageAccountFormValues) {
    return runMutation(
      "POST",
      { resource: "brokerageAccount", values },
      "Failed to add brokerage account"
    );
  }

  async function updateBrokerageAccount(
    id: string,
    values: Partial<BrokerageAccountFormValues>
  ) {
    return runMutation(
      "PATCH",
      { resource: "brokerageAccount", id, values },
      "Failed to update brokerage account"
    );
  }

  async function deleteBrokerageAccount(id: string) {
    return runMutation(
      "DELETE",
      { resource: "brokerageAccount", id },
      "Failed to delete brokerage account"
    );
  }

  async function addTrade(values: InvestmentTradeFormValues) {
    return runMutation("POST", { resource: "trade", values }, "Failed to save trade");
  }

  async function updateTrade(id: string, values: InvestmentTradeFormValues) {
    return runMutation(
      "PATCH",
      { resource: "trade", id, values },
      "Failed to update trade"
    );
  }

  async function deleteTrade(id: string) {
    return runMutation("DELETE", { resource: "trade", id }, "Failed to delete trade");
  }

  async function addCashMovement(values: InvestmentCashMovementFormValues) {
    return runMutation(
      "POST",
      { resource: "cashMovement", values },
      "Failed to save cash movement"
    );
  }

  async function updateCashMovement(
    id: string,
    values: InvestmentCashMovementFormValues
  ) {
    return runMutation(
      "PATCH",
      { resource: "cashMovement", id, values },
      "Failed to update cash movement"
    );
  }

  async function deleteCashMovement(id: string) {
    return runMutation(
      "DELETE",
      { resource: "cashMovement", id },
      "Failed to delete cash movement"
    );
  }

  async function addWatchlistItem(values: InvestmentWatchlistFormValues) {
    return runMutation(
      "POST",
      { resource: "watchlist", values },
      "Failed to save watchlist item"
    );
  }

  async function deleteWatchlistItem(id: string) {
    return runMutation(
      "DELETE",
      { resource: "watchlist", id },
      "Failed to delete watchlist item"
    );
  }

  async function addSavingsAccount(values: InvestmentSavingsAccountFormValues) {
    return runMutation(
      "POST",
      { resource: "savingsAccount", values },
      "Failed to save savings account"
    );
  }

  async function updateSavingsAccount(
    id: string,
    values: Partial<InvestmentSavingsAccountFormValues>
  ) {
    return runMutation(
      "PATCH",
      { resource: "savingsAccount", id, values },
      "Failed to update savings account"
    );
  }

  async function deleteSavingsAccount(id: string) {
    return runMutation(
      "DELETE",
      { resource: "savingsAccount", id },
      "Failed to delete savings account"
    );
  }

  async function addSavingsTransfer(values: InvestmentSavingsTransferFormValues) {
    return runMutation(
      "POST",
      { resource: "savingsTransfer", values },
      "Failed to save savings transfer"
    );
  }

  async function updateSavingsTransfer(
    id: string,
    values: InvestmentSavingsTransferFormValues
  ) {
    return runMutation(
      "PATCH",
      { resource: "savingsTransfer", id, values },
      "Failed to update savings transfer"
    );
  }

  async function deleteSavingsTransfer(id: string) {
    return runMutation(
      "DELETE",
      { resource: "savingsTransfer", id },
      "Failed to delete savings transfer"
    );
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
