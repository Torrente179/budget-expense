"use client";

import { useDeferredValue, useState } from "react";
import {
  Search,
  ShieldPlus,
  Trash2,
  Wallet,
} from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { useInvestments } from "@/hooks/use-investments";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InvestmentOverviewCards } from "@/components/investments/investment-overview-cards";
import { HoldingsTable } from "@/components/investments/holdings-table";
import { BrokerageAccountForm } from "@/components/investments/brokerage-account-form";
import { TradeForm } from "@/components/investments/trade-form";
import { TradeTable } from "@/components/investments/trade-table";
import { CashMovementForm } from "@/components/investments/cash-movement-form";
import { CashMovementTable } from "@/components/investments/cash-movement-table";
import { WatchlistForm } from "@/components/investments/watchlist-form";
import { WatchlistGrid } from "@/components/investments/watchlist-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InvestmentsPage() {
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState("all");
  const deferredSearch = useDeferredValue(search);
  const { baseCurrency } = useCurrency();
  const {
    accounts,
    trades,
    cashMovements,
    watchlist,
    latestQuotes,
    overview,
    loading,
    quoteLoading,
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
    addWatchlistItem,
    deleteWatchlistItem,
  } = useInvestments();

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      deferredSearch.length === 0 ||
      trade.investment_assets.symbol
        .toLowerCase()
        .includes(deferredSearch.toLowerCase()) ||
      (trade.investment_assets.display_name ?? "")
        .toLowerCase()
        .includes(deferredSearch.toLowerCase()) ||
      trade.brokerage_accounts.name
        .toLowerCase()
        .includes(deferredSearch.toLowerCase());

    const matchesAccount =
      accountFilter === "all" || trade.account_id === accountFilter;
    const matchesSide = sideFilter === "all" || trade.side === sideFilter;

    return matchesSearch && matchesAccount && matchesSide;
  });

  async function handleDeleteAccount(id: string) {
    if (!window.confirm("Delete this brokerage account and all linked records?")) {
      return;
    }

    await deleteBrokerageAccount(id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investments"
        description={
          loading
            ? "Manual-first portfolio tracking for IBKR, Hapi, Colombian stocks, US assets, and crypto."
            : `${overview.openPositionsCount} open position${overview.openPositionsCount !== 1 ? "s" : ""} · ${watchlist.length} watchlist asset${watchlist.length !== 1 ? "s" : ""}`
        }
      >
        <BrokerageAccountForm onSubmit={addBrokerageAccount} />
        <TradeForm
          accounts={accounts}
          lookupPrice={lookupMarketPrice}
          onSubmit={addTrade}
        />
      </PageHeader>

      {accounts.length === 0 && !loading ? (
        <EmptyState
          icon={ShieldPlus}
          title="Start with a brokerage account"
          description="Add your IBKR or Hapi account first so trades, withdrawals, and watchlist ideas have a home."
        >
          <BrokerageAccountForm onSubmit={addBrokerageAccount} />
        </EmptyState>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="cash">Cash</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <InvestmentOverviewCards
            totalMarketValue={overview.totalMarketValue}
            totalUnrealizedPnl={overview.totalUnrealizedPnl}
            totalRealizedPnl={overview.totalRealizedPnl}
            openPositionsCount={overview.openPositionsCount}
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_380px]">
            <HoldingsTable holdings={overview.holdings} />

            <div className="space-y-5">
              <Card className="border-border/80 bg-card/96">
                <CardHeader className="border-b border-border/70">
                  <CardTitle>Account summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] border border-border/70 bg-secondary/35 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                        Estimated cash
                      </p>
                      <p className="mt-3 font-heading text-[1.5rem] font-semibold leading-none tracking-[-0.04em]">
                        {formatCurrency(overview.estimatedCash, baseCurrency)}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-border/70 bg-secondary/35 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                        Net contributions
                      </p>
                      <p className="mt-3 font-heading text-[1.5rem] font-semibold leading-none tracking-[-0.04em]">
                        {formatCurrency(overview.netContributions, baseCurrency)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {overview.accountSummaries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Add deposits, withdrawals, or trades to populate account
                        cash summaries.
                      </p>
                    ) : (
                      overview.accountSummaries.map((account) => (
                        <div
                          key={account.accountId}
                          className="rounded-[1.25rem] border border-border/70 bg-secondary/25 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {account.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {account.brokerKind}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm text-foreground">
                                {formatCurrency(account.estimatedCash, baseCurrency)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                est. cash
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/80 bg-card/96">
                <CardHeader className="border-b border-border/70">
                  <CardTitle>Brokerage accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-[1.25rem] border border-border/70 bg-secondary/25 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {account.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {account.broker_kind} · {account.account_currency}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <BrokerageAccountForm
                            defaultValues={{
                              broker_kind: account.broker_kind as "IBKR" | "HAPI",
                              name: account.name,
                              account_currency: account.account_currency,
                              fee_mode: account.fee_mode as
                                | "manual"
                                | "percent"
                                | "fixed"
                                | "percent_plus_fixed",
                              fee_percent: Number(account.fee_percent),
                              fee_fixed_amount: Number(account.fee_fixed_amount),
                              fee_min_amount: Number(account.fee_min_amount),
                              fee_currency: account.fee_currency,
                            }}
                            onSubmit={(values) =>
                              updateBrokerageAccount(account.id, values)
                            }
                            trigger={
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-2xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => void handleDeleteAccount(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Fee mode: {account.fee_mode.replaceAll("_", " ")}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-5">
          <div className="rounded-[1.65rem] border border-border/80 bg-card/96 p-4 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.86)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="flex-1 space-y-2">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                  Search
                </p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search symbols, names, or accounts..."
                    className="h-11 rounded-2xl pl-9 text-sm"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[220px_160px_auto]">
                <div className="space-y-2">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    Account
                  </p>
                  <Select
                    value={accountFilter}
                    onValueChange={(value) => value && setAccountFilter(value)}
                  >
                    <SelectTrigger className="h-11 rounded-2xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All accounts</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    Side
                  </p>
                  <Select
                    value={sideFilter}
                    onValueChange={(value) => value && setSideFilter(value)}
                  >
                    <SelectTrigger className="h-11 rounded-2xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <TradeForm
                  accounts={accounts}
                  lookupPrice={lookupMarketPrice}
                  onSubmit={addTrade}
                />
              </div>
            </div>
          </div>

          <TradeTable
            trades={filteredTrades}
            accounts={accounts}
            loading={loading}
            lookupPrice={lookupMarketPrice}
            onUpdate={updateTrade}
            onDelete={deleteTrade}
          />
        </TabsContent>

        <TabsContent value="cash" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <Card className="border-border/80 bg-card/96">
              <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    Estimated cash
                  </p>
                  <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                    {formatCurrency(overview.estimatedCash, baseCurrency)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    Net contributions
                  </p>
                  <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                    {formatCurrency(overview.netContributions, baseCurrency)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <CashMovementForm accounts={accounts} onSubmit={addCashMovement} />
          </div>

          <CashMovementTable
            cashMovements={cashMovements}
            accounts={accounts}
            loading={loading}
            onUpdate={updateCashMovement}
            onDelete={deleteCashMovement}
          />
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <Card className="border-border/80 bg-card/96">
              <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    Watchlist assets
                  </p>
                  <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                    {overview.watchlistCount}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    Tracked assets
                  </p>
                  <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                    {overview.trackedAssetsCount}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    Price refresh
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {quoteLoading ? "Refreshing quotes..." : "Latest daily cache loaded"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <WatchlistForm onSubmit={addWatchlistItem} />
          </div>

          <WatchlistGrid
            items={watchlist}
            latestQuotes={latestQuotes}
            onDelete={deleteWatchlistItem}
          />
        </TabsContent>
      </Tabs>

      {accounts.length === 0 && !loading ? (
        <Card className="border-border/80 bg-card/96">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 rounded-[1.25rem] border border-border/70 bg-secondary/35 p-4">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm leading-6 text-muted-foreground">
                Add a brokerage account before creating cash movements or trades.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
