"use client";

import { useCallback } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  fetchInvestmentCashPage,
  fetchInvestmentOverview,
  fetchInvestmentSavingsPage,
  fetchInvestmentTradesPage,
  fetchInvestmentWatchlist,
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
import { queryKeys } from "@/lib/query/keys";

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

function buildLatestQuoteMap(quotes: LatestQuote[]) {
  return quotes.reduce<Record<string, LatestQuote>>((accumulator, quote) => {
    accumulator[quote.assetKey] = quote;
    return accumulator;
  }, {});
}

interface UseInvestmentsOptions {
  includeTrades?: boolean;
  includeCash?: boolean;
  includeSavings?: boolean;
  includeWatchlist?: boolean;
}

export function useInvestments(options: UseInvestmentsOptions = {}) {
  const {
    includeTrades = true,
    includeCash = true,
    includeSavings = true,
    includeWatchlist = true,
  } = options;
  const { convert } = useCurrency();
  const queryClient = useQueryClient();
  const overviewQuery = useQuery({
    queryKey: queryKeys.investmentOverview,
    queryFn: ({ signal }) => fetchInvestmentOverview(signal),
  });
  const tradesQuery = useInfiniteQuery({
    queryKey: queryKeys.investmentTrades,
    queryFn: ({ pageParam, signal }) =>
      fetchInvestmentTradesPage(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page.hasMore
        ? lastPage.page.offset + lastPage.page.limit
        : undefined,
    enabled: includeTrades,
  });
  const cashQuery = useInfiniteQuery({
    queryKey: queryKeys.investmentCash,
    queryFn: ({ pageParam, signal }) =>
      fetchInvestmentCashPage(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page.hasMore
        ? lastPage.page.offset + lastPage.page.limit
        : undefined,
    enabled: includeCash,
  });
  const savingsQuery = useInfiniteQuery({
    queryKey: queryKeys.investmentSavings,
    queryFn: ({ pageParam, signal }) =>
      fetchInvestmentSavingsPage(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page.hasMore
        ? lastPage.page.offset + lastPage.page.limit
        : undefined,
    enabled: includeSavings,
  });
  const watchlistQuery = useQuery({
    queryKey: queryKeys.investmentWatchlist,
    queryFn: ({ signal }) => fetchInvestmentWatchlist(signal),
    enabled: includeWatchlist,
  });

  const overviewResource = overviewQuery.data;
  const accounts = (overviewResource?.accounts ?? []) as BrokerageAccountRow[];
  const assets = (overviewResource?.assets ?? []) as InvestmentAssetRow[];
  const positionTrades = (
    (overviewResource?.positionTrades ?? []) as TradeWithOptionalJoins[]
  ).filter(hasTradeJoins);
  const overviewCash = (
    (overviewResource?.cashLedger ?? []) as CashMovementWithOptionalJoins[]
  ).filter(hasCashMovementJoins);
  const overviewWatchlist = (
    (overviewResource?.watchlist ?? []) as WatchlistWithOptionalJoins[]
  ).filter(hasWatchlistJoins);
  const trades = (tradesQuery.data?.pages ?? [])
    .flatMap((page) => page.items as TradeWithOptionalJoins[])
    .filter(hasTradeJoins);
  const cashMovements = (cashQuery.data?.pages ?? [])
    .flatMap((page) => page.items as CashMovementWithOptionalJoins[])
    .filter(hasCashMovementJoins);
  const savingsAccounts = (savingsQuery.data?.pages[0]?.accounts ??
    []) as InvestmentSavingsAccountRow[];
  const savingsTransfers = (savingsQuery.data?.pages ?? [])
    .flatMap((page) => page.transfers as SavingsTransferWithOptionalJoins[])
    .filter(hasSavingsTransferJoins);
  const savingsBalanceTotals = savingsQuery.data?.pages[0]?.balanceTotals ?? [];
  const watchlistSource = includeWatchlist
    ? watchlistQuery.data ?? []
    : overviewWatchlist;
  const watchlist = (watchlistSource as WatchlistWithOptionalJoins[]).filter(
    hasWatchlistJoins
  );
  const targetAssetMap = new Map<string, InvestmentAssetRow>();
  assets.forEach((asset) => targetAssetMap.set(asset.id, asset));
  watchlist.forEach((item) =>
    targetAssetMap.set(item.investment_assets.id, item.investment_assets)
  );
  positionTrades.forEach((trade) =>
    targetAssetMap.set(trade.investment_assets.id, trade.investment_assets)
  );
  const targetAssets = Array.from(targetAssetMap.values());
  const quotesQuery = useQuery({
    queryKey: queryKeys.marketQuotes(targetAssets.map((asset) => asset.asset_key)),
    enabled: targetAssets.length > 0,
    staleTime: 15 * 60 * 1000,
    queryFn: async ({ signal }) => {
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
        signal,
      });
      if (!response.ok) throw new Error("Market quotes unavailable");
      const data = (await response.json()) as { quotes?: LatestQuote[] };
      return buildLatestQuoteMap(data.quotes ?? []);
    },
  });
  const latestQuotes = quotesQuery.data ?? {};
  const loading =
    overviewQuery.isPending ||
    (includeTrades && tradesQuery.isPending) ||
    (includeCash && cashQuery.isPending) ||
    (includeSavings && savingsQuery.isPending) ||
    (includeWatchlist && watchlistQuery.isPending);
  const quoteLoading = quotesQuery.isPending;

  const overview = buildInvestmentOverview({
    trades: positionTrades,
    cashMovements: overviewCash,
    watchlist: overviewWatchlist,
    latestQuotes,
    convert,
  });
  const savingsAccountSummaries = savingsAccounts
    .map((account) => {
      const balance = savingsBalanceTotals
        .filter((total) => total.accountId === account.id)
        .reduce(
          (sum, total) =>
            sum + convert(Number(total.amount), total.currency),
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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.investmentsAll,
      });
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
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.investmentsAll }),
    hasMoreTrades: Boolean(tradesQuery.hasNextPage),
    loadMoreTrades: tradesQuery.fetchNextPage,
    loadingMoreTrades: tradesQuery.isFetchingNextPage,
    hasMoreCash: Boolean(cashQuery.hasNextPage),
    loadMoreCash: cashQuery.fetchNextPage,
    loadingMoreCash: cashQuery.isFetchingNextPage,
    hasMoreSavings: Boolean(savingsQuery.hasNextPage),
    loadMoreSavings: savingsQuery.fetchNextPage,
    loadingMoreSavings: savingsQuery.isFetchingNextPage,
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
