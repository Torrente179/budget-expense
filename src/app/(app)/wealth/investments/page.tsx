"use client";

import { useDeferredValue, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Search, Trash2 } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { useInvestments } from "@/hooks/use-investments";
import { formatCurrency } from "@/lib/utils";
import { Screen } from "@/components/patterns/screen";
import { UnderlineTabs } from "@/components/patterns/underline-tabs";
import { WealthBreadcrumb } from "@/components/wealth/wealth-breadcrumb";
import { WealthCategoryHero } from "@/components/wealth/wealth-category-hero";
import { TrendingUp } from "lucide-react";
import { InvestmentOverviewCards } from "@/components/wealth/investment-overview-cards";
import { HoldingsTable } from "@/components/wealth/holdings-table";
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
import type { BrokerageAccountRow } from "@/lib/investments";

const BrokerageAccountForm = dynamic(() =>
  import("@/components/wealth/brokerage-account-form").then(
    (module) => module.BrokerageAccountForm
  )
);
const TradeForm = dynamic(() =>
  import("@/components/wealth/trade-form").then((module) => module.TradeForm)
);
const TradeTable = dynamic(() =>
  import("@/components/wealth/trade-table").then((module) => module.TradeTable)
);
const CashMovementForm = dynamic(() =>
  import("@/components/wealth/cash-movement-form").then(
    (module) => module.CashMovementForm
  )
);
const CashMovementTable = dynamic(() =>
  import("@/components/wealth/cash-movement-table").then(
    (module) => module.CashMovementTable
  )
);
const WatchlistForm = dynamic(() =>
  import("@/components/wealth/watchlist-form").then(
    (module) => module.WatchlistForm
  )
);
const WatchlistGrid = dynamic(() =>
  import("@/components/wealth/watchlist-grid").then(
    (module) => module.WatchlistGrid
  )
);

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
  const [tradeSheetMounted, setTradeSheetMounted] = useState(false);
  const [tradeSheetOpen, setTradeSheetOpen] = useState(false);
  const [accountDialogMounted, setAccountDialogMounted] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<BrokerageAccountRow | null>(null);
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
    hasMoreTrades,
    loadMoreTrades,
    loadingMoreTrades,
    hasMoreCash,
    loadMoreCash,
    loadingMoreCash,
  } = useInvestments({
    includeTrades: tab === "orders",
    includeCash: tab === "cash",
    includeSavings: false,
    includeWatchlist: tab === "watchlist",
  });

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

  function openTradeSheet() {
    setTradeSheetMounted(true);
    setTradeSheetOpen(true);
  }

  function openAccountDialog(account: BrokerageAccountRow | null = null) {
    setEditingAccount(account);
    setAccountDialogMounted(true);
    setAccountDialogOpen(true);
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
          <Button size="sm" className="gap-1.5" onClick={openTradeSheet}>
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">{t("Add trade", "Agregar operación")}</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => openAccountDialog()}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">{t("Add broker", "Agregar broker")}</span>
          </Button>
        </>
      }
      subheader={<WealthBreadcrumb current={t("Investments", "Inversiones")} />}
    >
      {accounts.length > 0 || loading ? (
        <WealthCategoryHero
          eyebrow={t("Portfolio value", "Valor de tus inversiones")}
          amount={overview.totalMarketValue + overview.estimatedCash}
          icon={TrendingUp}
          delta={
            overview.totalUnrealizedPnl !== 0
              ? {
                  amount: overview.totalUnrealizedPnl,
                  label:
                    overview.totalCostBasis > 0
                      ? `· ${(
                          (overview.totalUnrealizedPnl /
                            overview.totalCostBasis) *
                          100
                        ).toFixed(2)}% ${t("return", "de rentabilidad")}`
                      : t("unrealized", "no realizada"),
                }
              : null
          }
          stats={[
            {
              label: t("Contributed", "Capital aportado"),
              value: formatCurrency(overview.totalCostBasis, baseCurrency),
            },
            {
              label: t("Realized", "Ganancia realizada"),
              value: formatCurrency(overview.totalRealizedPnl, baseCurrency),
              tone: overview.totalRealizedPnl >= 0 ? "positive" : "negative",
            },
            {
              label: t("Broker cash", "Caja de broker"),
              value: formatCurrency(overview.estimatedCash, baseCurrency),
            },
          ]}
        />
      ) : null}

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
              <Button size="sm" className="gap-1.5" onClick={openTradeSheet}>
                <Plus className="h-4 w-4" />
                {t("Add trade", "Agregar operación")}
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => openAccountDialog()}
              >
                <Plus className="h-4 w-4" />
                {t("Add broker", "Agregar broker")}
              </Button>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => openAccountDialog(account)}
                          >
                            {t("Edit", "Editar")}
                          </Button>
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
              <Button size="sm" className="gap-1.5" onClick={openTradeSheet}>
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">
                  {t("Add trade", "Agregar operación")}
                </span>
              </Button>
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
          {hasMoreTrades ? (
            <Button
              variant="outline"
              className="mx-auto"
              disabled={loadingMoreTrades}
              onClick={() => void loadMoreTrades()}
            >
              {loadingMoreTrades
                ? t("Loading…", "Cargando…")
                : t("Load more orders", "Cargar más órdenes")}
            </Button>
          ) : null}
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
          {hasMoreCash ? (
            <Button
              variant="outline"
              className="mx-auto"
              disabled={loadingMoreCash}
              onClick={() => void loadMoreCash()}
            >
              {loadingMoreCash
                ? t("Loading…", "Cargando…")
                : t("Load more cash movements", "Cargar más movimientos")}
            </Button>
          ) : null}
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

      {tradeSheetMounted ? (
        <TradeForm
          accounts={accounts}
          lookupPrice={lookupMarketPrice}
          onSubmit={addTrade}
          controlledOpen={tradeSheetOpen}
          onOpenChange={setTradeSheetOpen}
        />
      ) : null}

      {accountDialogMounted ? (
        <BrokerageAccountForm
          key={editingAccount?.id ?? "new"}
          defaultValues={
            editingAccount
              ? {
                  broker_kind: editingAccount.broker_kind,
                  name: editingAccount.name,
                  account_currency: editingAccount.account_currency,
                  fee_mode: editingAccount.fee_mode as
                    | "manual"
                    | "percent"
                    | "fixed"
                    | "percent_plus_fixed",
                  fee_percent: Number(editingAccount.fee_percent),
                  fee_fixed_amount: Number(editingAccount.fee_fixed_amount),
                  fee_min_amount: Number(editingAccount.fee_min_amount),
                  fee_currency: editingAccount.fee_currency,
                }
              : undefined
          }
          onSubmit={(values) =>
            editingAccount
              ? updateBrokerageAccount(editingAccount.id, values)
              : addBrokerageAccount(values)
          }
          controlledOpen={accountDialogOpen}
          onOpenChange={(open) => {
            setAccountDialogOpen(open);
            if (!open) setEditingAccount(null);
          }}
        />
      ) : null}
    </Screen>
  );
}
