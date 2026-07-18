"use client";

import { useDeferredValue, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { useInvestments } from "@/hooks/use-investments";
import { formatCurrency } from "@/lib/utils";
import { Screen } from "@/components/patterns/screen";
import { UnderlineTabs } from "@/components/patterns/underline-tabs";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/patterns/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/providers/locale-provider";

type InvestTab = "overview" | "orders" | "cash" | "watchlist";

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="label-caps">{label}</p>
      <p className="mt-1.5 font-mono text-title font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

export default function InvestmentStocksPage() {
  const { t } = useLocale();
  const [tab, setTab] = useState<InvestTab>("overview");
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

  const tabs: { key: InvestTab; label: string }[] = [
    { key: "overview", label: t("Overview", "Resumen") },
    { key: "orders", label: t("Orders", "Órdenes") },
    { key: "cash", label: t("Cash", "Caja") },
    { key: "watchlist", label: t("Watchlist", "Seguimiento") },
  ];

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
        <Card>
          <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <p className="text-body text-muted-foreground">
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

      <UnderlineTabs
        tabs={tabs}
        value={tab}
        onChange={setTab}
        ariaLabel={t("Investment views", "Vistas de inversión")}
      />

      {tab === "overview" && (
        <div className="space-y-5">
          <InvestmentOverviewCards
            totalMarketValue={overview.totalMarketValue}
            totalUnrealizedPnl={overview.totalUnrealizedPnl}
            totalRealizedPnl={overview.totalRealizedPnl}
            openPositionsCount={overview.openPositionsCount}
          />

          <div className="xl:grid xl:grid-cols-[minmax(0,1.35fr)_360px] xl:gap-5">
            <HoldingsTable holdings={overview.holdings} />

            <div className="hidden space-y-4 xl:block">
              <Card>
                <CardHeader>
                  <SectionHeader
                    eyebrow={t("Cash", "Caja")}
                    title={t("Broker summary", "Resumen por broker")}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <MiniStat
                      label={t("Estimated cash", "Caja estimada")}
                      value={formatCurrency(overview.estimatedCash, baseCurrency)}
                    />
                    <MiniStat
                      label={t("Net contributions", "Aportes netos")}
                      value={formatCurrency(
                        overview.netContributions,
                        baseCurrency
                      )}
                    />
                  </div>

                  {overview.accountSummaries.length === 0 ? (
                    <p className="text-caption text-muted-foreground">
                      {t(
                        "Add deposits, withdrawals, or positions to populate broker cash.",
                        "Agrega depósitos, retiros o posiciones para completar la caja por broker."
                      )}
                    </p>
                  ) : (
                    <div className="divide-y divide-border/40 border-t border-border/40 pt-1">
                      {overview.accountSummaries.map((account) => (
                        <div
                          key={account.accountId}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-body font-medium">
                              {account.name}
                            </p>
                            <p className="text-caption text-muted-foreground">
                              {account.brokerKind}
                            </p>
                          </div>
                          <p className="shrink-0 font-mono text-body tabular-nums">
                            {formatCurrency(account.estimatedCash, baseCurrency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <SectionHeader
                    eyebrow={t("Accounts", "Cuentas")}
                    title={t("Saved brokers", "Brokers guardados")}
                  />
                </CardHeader>
                <CardContent className="space-y-1">
                  {accounts.length === 0 ? (
                    <p className="text-caption text-muted-foreground">
                      {t(
                        "Saved brokers appear here after your first record.",
                        "Los brokers guardados aparecen tras tu primer registro."
                      )}
                    </p>
                  ) : (
                    accounts.map((account) => (
                      <div
                        key={account.id}
                        className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-body font-medium">
                            {account.broker_kind}
                          </p>
                          <p className="text-caption text-muted-foreground">
                            {account.name} · {account.account_currency}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100"
                              >
                                {t("Edit", "Editar")}
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("Delete", "Eliminar")}
                            className="h-8 w-8 rounded-lg text-muted-foreground opacity-0 transition-colors hover:bg-danger-subtle hover:text-danger group-hover:opacity-100"
                            onClick={() => void handleDeleteAccount(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t(
                  "Search symbols, names, or brokers...",
                  "Busca símbolos, nombres o brokers..."
                )}
                className="h-10 rounded-full pl-9 text-sm"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={brokerFilter}
                onValueChange={(value) => value && setBrokerFilter(value)}
              >
                <SelectTrigger
                  aria-label={t("Broker", "Broker")}
                  className="h-10 w-[160px] rounded-full text-sm"
                >
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
              <Select
                value={sideFilter}
                onValueChange={(value) => value && setSideFilter(value)}
              >
                <SelectTrigger
                  aria-label={t("Side", "Lado")}
                  className="h-10 w-[120px] rounded-full text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All", "Todos")}</SelectItem>
                  <SelectItem value="buy">{t("Buy", "Compra")}</SelectItem>
                  <SelectItem value="sell">{t("Sell", "Venta")}</SelectItem>
                </SelectContent>
              </Select>
              <TradeForm
                accounts={accounts}
                lookupPrice={lookupMarketPrice}
                onSubmit={addTrade}
              />
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
        </div>
      )}

      {tab === "cash" && (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-8">
              <MiniStat
                label={t("Estimated cash", "Caja estimada")}
                value={formatCurrency(overview.estimatedCash, baseCurrency)}
              />
              <MiniStat
                label={t("Net contributions", "Aportes netos")}
                value={formatCurrency(overview.netContributions, baseCurrency)}
              />
            </div>
            <CashMovementForm accounts={accounts} onSubmit={addCashMovement} />
          </div>

          <CashMovementTable
            cashMovements={cashMovements}
            accounts={accounts}
            loading={loading}
            onUpdate={updateCashMovement}
            onDelete={deleteCashMovement}
          />
        </div>
      )}

      {tab === "watchlist" && (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-8">
              <MiniStat
                label={t("Watchlist assets", "Activos en seguimiento")}
                value={overview.watchlistCount}
              />
              <MiniStat
                label={t("Tracked assets", "Activos rastreados")}
                value={overview.trackedAssetsCount}
              />
              <div className="hidden sm:block">
                <p className="label-caps">
                  {t("Prices", "Precios")}
                </p>
                <p className="mt-1.5 text-caption text-muted-foreground">
                  {quoteLoading
                    ? t("Refreshing…", "Actualizando…")
                    : t("Daily cache loaded", "Caché diario cargado")}
                </p>
              </div>
            </div>
            <WatchlistForm onSubmit={addWatchlistItem} />
          </div>

          <WatchlistGrid
            items={watchlist}
            latestQuotes={latestQuotes}
            onDelete={deleteWatchlistItem}
          />
        </div>
      )}
    </Screen>
  );
}
