"use client";

import { useDeferredValue, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { useInvestments } from "@/hooks/use-investments";
import { formatCurrency } from "@/lib/utils";
import { Screen } from "@/components/patterns/screen";
import { WealthNav } from "@/components/wealth/wealth-nav";
import { InvestmentOverviewCards } from "@/components/wealth/investment-overview-cards";
import { HoldingsTable } from "@/components/wealth/holdings-table";
import { BrokerageAccountForm } from "@/components/wealth/brokerage-account-form";
import { TradeForm } from "@/components/wealth/trade-form";
import { TradeTable } from "@/components/wealth/trade-table";
import { CashMovementForm } from "@/components/wealth/cash-movement-form";
import { CashMovementTable } from "@/components/wealth/cash-movement-table";
import { WatchlistForm } from "@/components/wealth/watchlist-form";
import { WatchlistGrid } from "@/components/wealth/watchlist-grid";
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
import { useLocale } from "@/providers/locale-provider";

export default function InvestmentStocksPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [brokerFilter, setBrokerFilter] = useState("all");
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

  const brokerChoices = Array.from(
    new Set([
      ...accounts.map((account) => account.broker_kind),
      ...trades.map((trade) => trade.brokerage_accounts.broker_kind),
    ])
  ).sort((left, right) => left.localeCompare(right));

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      deferredSearch.length === 0 ||
      trade.investment_assets.symbol
        .toLowerCase()
        .includes(deferredSearch.toLowerCase()) ||
      (trade.investment_assets.display_name ?? "")
        .toLowerCase()
        .includes(deferredSearch.toLowerCase()) ||
      trade.brokerage_accounts.broker_kind
        .toLowerCase()
        .includes(deferredSearch.toLowerCase()) ||
      trade.brokerage_accounts.name
        .toLowerCase()
        .includes(deferredSearch.toLowerCase());

    const matchesBroker =
      brokerFilter === "all" ||
      trade.brokerage_accounts.broker_kind === brokerFilter;
    const matchesSide = sideFilter === "all" || trade.side === sideFilter;

    return matchesSearch && matchesBroker && matchesSide;
  });

  async function handleDeleteAccount(id: string) {
    if (
      !window.confirm(
        t(
          "Delete this brokerage account and all linked records?",
          "¿Eliminar esta cuenta de broker y todos los registros vinculados?"
        )
      )
    ) {
      return;
    }

    await deleteBrokerageAccount(id);
  }

  return (
    <Screen
      title={t("Investments", "Inversiones")}
      backHref="/wealth"
      actions={
        <>
          <TradeForm
            accounts={accounts}
            lookupPrice={lookupMarketPrice}
            onSubmit={addTrade}
          />
          <BrokerageAccountForm onSubmit={addBrokerageAccount} />
        </>
      }
      subheader={<WealthNav />}
    >

      {accounts.length === 0 && !loading ? (
        <Card className="bg-card">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <p className="text-sm text-muted-foreground">
              {t(
                "Add your first position to get started.",
                "Agrega tu primera posición para empezar."
              )}
            </p>
            <div className="flex shrink-0 gap-2">
              <TradeForm
                accounts={accounts}
                lookupPrice={lookupMarketPrice}
                onSubmit={addTrade}
              />
              <BrokerageAccountForm onSubmit={addBrokerageAccount} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="overview">{t("Overview", "Resumen")}</TabsTrigger>
          <TabsTrigger value="orders">{t("Orders", "Órdenes")}</TabsTrigger>
          <TabsTrigger value="cash">{t("Cash", "Caja")}</TabsTrigger>
          <TabsTrigger value="watchlist">
            {t("Watchlist", "Seguimiento")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <InvestmentOverviewCards
            totalMarketValue={overview.totalMarketValue}
            totalUnrealizedPnl={overview.totalUnrealizedPnl}
            totalRealizedPnl={overview.totalRealizedPnl}
            openPositionsCount={overview.openPositionsCount}
          />

          <div className="xl:grid xl:grid-cols-[minmax(0,1.35fr)_380px] xl:gap-5">
            <HoldingsTable holdings={overview.holdings} />

            <div className="hidden space-y-5 xl:block">
              <Card className="bg-card">
                <CardHeader className="border-b border-border/70">
                  <CardTitle>{t("Broker summary", "Resumen por broker")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-secondary/35 p-4">
                      <p className="label-caps">
                        {t("Estimated cash", "Caja estimada")}
                      </p>
                      <p className="mt-3 font-heading text-title font-semibold leading-none tracking-tight">
                        {formatCurrency(overview.estimatedCash, baseCurrency)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-secondary/35 p-4">
                      <p className="label-caps">
                        {t("Net contributions", "Aportes netos")}
                      </p>
                      <p className="mt-3 font-heading text-title font-semibold leading-none tracking-tight">
                        {formatCurrency(overview.netContributions, baseCurrency)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {overview.accountSummaries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "Add deposits, withdrawals, or positions to populate broker cash summaries.",
                          "Agrega depósitos, retiros o posiciones para completar el resumen de caja por broker."
                        )}
                      </p>
                    ) : (
                      overview.accountSummaries.map((account) => (
                        <div
                          key={account.accountId}
                          className="rounded-lg border border-border/70 bg-secondary/25 p-4"
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
                                {t("est. cash", "caja est.")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="border-b border-border/70">
                  <CardTitle>{t("Saved brokers", "Brokers guardados")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {accounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "Saved brokers will appear here after your first position or cash movement.",
                        "Los brokers guardados aparecerán aquí después de tu primera posición o movimiento de caja."
                      )}
                    </p>
                  ) : (
                    accounts.map((account) => (
                      <div
                        key={account.id}
                        className="rounded-lg border border-border/70 bg-secondary/25 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {account.broker_kind}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {account.account_currency}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <BrokerageAccountForm
                              defaultValues={{
                                broker_kind: account.broker_kind,
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
                                  {t("Edit", "Editar")}
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
                          {t("Saved label", "Etiqueta guardada")}: {account.name} ·{" "}
                          {t("Fee mode", "Modo de comisión")}: {" "}
                          {account.fee_mode.replaceAll("_", " ")}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-5">
          <div className="rounded-xl border bg-card p-4 shadow-1">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="flex-1 space-y-2">
                <p className="text-label font-medium uppercase tracking-widest text-muted-foreground">
                  {t("Search", "Buscar")}
                </p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t(
                      "Search symbols, names, or brokers...",
                      "Busca símbolos, nombres o brokers..."
                    )}
                    className="h-11 rounded-2xl pl-9 text-sm"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[220px_160px_auto]">
                <div className="space-y-2">
                  <p className="text-label font-medium uppercase tracking-widest text-muted-foreground">
                    {t("Broker", "Broker")}
                  </p>
                  <Select
                    value={brokerFilter}
                    onValueChange={(value) => value && setBrokerFilter(value)}
                  >
                    <SelectTrigger className="h-11 rounded-2xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("All brokers", "Todos los brokers")}
                      </SelectItem>
                      {brokerChoices.map((broker) => (
                        <SelectItem key={broker} value={broker}>
                          {broker}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-label font-medium uppercase tracking-widest text-muted-foreground">
                    {t("Side", "Lado")}
                  </p>
                  <Select
                    value={sideFilter}
                    onValueChange={(value) => value && setSideFilter(value)}
                  >
                    <SelectTrigger className="h-11 rounded-2xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("All", "Todos")}</SelectItem>
                      <SelectItem value="buy">{t("Buy", "Compra")}</SelectItem>
                      <SelectItem value="sell">{t("Sell", "Venta")}</SelectItem>
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
            <Card className="bg-card">
              <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-secondary/35 p-4">
                  <p className="label-caps">
                    {t("Estimated cash", "Caja estimada")}
                  </p>
                  <p className="mt-3 font-heading text-title font-semibold leading-none tracking-tight">
                    {formatCurrency(overview.estimatedCash, baseCurrency)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-secondary/35 p-4">
                  <p className="label-caps">
                    {t("Net contributions", "Aportes netos")}
                  </p>
                  <p className="mt-3 font-heading text-title font-semibold leading-none tracking-tight">
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
            <Card className="bg-card">
              <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                <div className="rounded-lg border border-border/70 bg-secondary/35 p-4">
                  <p className="label-caps">
                    {t("Watchlist assets", "Activos en seguimiento")}
                  </p>
                  <p className="mt-3 font-heading text-title font-semibold leading-none tracking-tight">
                    {overview.watchlistCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-secondary/35 p-4">
                  <p className="label-caps">
                    {t("Tracked assets", "Activos rastreados")}
                  </p>
                  <p className="mt-3 font-heading text-title font-semibold leading-none tracking-tight">
                    {overview.trackedAssetsCount}
                  </p>
                </div>
                <div className="hidden rounded-lg border border-border/70 bg-secondary/35 p-4 sm:block">
                  <p className="label-caps">
                    {t("Price refresh", "Actualización de precios")}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {quoteLoading
                      ? t("Refreshing quotes...", "Actualizando cotizaciones...")
                      : t("Latest daily cache loaded", "Último caché diario cargado")}
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
    </Screen>
  );
}
