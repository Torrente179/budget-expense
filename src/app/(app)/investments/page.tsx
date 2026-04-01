"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, Trash2, Wallet } from "lucide-react";
import { useCurrency } from "@/providers/currency-provider";
import { useInvestments } from "@/hooks/use-investments";
import { buildSavingsAccountLabel } from "@/lib/investments";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { InvestmentOverviewCards } from "@/components/investments/investment-overview-cards";
import { HoldingsTable } from "@/components/investments/holdings-table";
import { BrokerageAccountForm } from "@/components/investments/brokerage-account-form";
import { TradeForm } from "@/components/investments/trade-form";
import { TradeTable } from "@/components/investments/trade-table";
import { CashMovementForm } from "@/components/investments/cash-movement-form";
import { CashMovementTable } from "@/components/investments/cash-movement-table";
import { SavingsAccountForm } from "@/components/investments/savings-account-form";
import { SavingsTransferForm } from "@/components/investments/savings-transfer-form";
import { SavingsTransferTable } from "@/components/investments/savings-transfer-table";
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
import { useLocale } from "@/providers/locale-provider";

export default function InvestmentsPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [brokerFilter, setBrokerFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState("all");
  const deferredSearch = useDeferredValue(search);
  const { baseCurrency, rates } = useCurrency();
  const {
    accounts,
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
  } = useInvestments();

  const convertBetween = useMemo(
    () =>
      (amount: number, fromCurrency: string, toCurrency: string) => {
        if (fromCurrency === toCurrency) {
          return amount;
        }

        const fromRate = rates[fromCurrency];
        const toRate = rates[toCurrency];
        if (!fromRate || !toRate) {
          return amount;
        }

        return (amount / fromRate) * toRate;
      },
    [rates]
  );

  const savingsTotalsByCurrency = useMemo(
    () =>
      ["USD", "EUR", "COP"].map((currency) => {
        const stocksValue = convertBetween(
          overview.totalMarketValue,
          baseCurrency,
          currency
        );
        const savingsValue = savingsTransfers.reduce(
          (sum, transfer) =>
            sum + convertBetween(Number(transfer.amount), transfer.currency, currency),
          0
        );

        return {
          currency,
          total: stocksValue + savingsValue,
          stocksValue,
          savingsValue,
        };
      }),
    [baseCurrency, convertBetween, overview.totalMarketValue, savingsTransfers]
  );
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

  async function handleDeleteSavingsAccount(id: string) {
    if (
      !window.confirm(
        t(
          "Delete this savings account and all linked transfers?",
          "¿Eliminar esta cuenta de ahorro y todas las transferencias vinculadas?"
        )
      )
    ) {
      return;
    }

    await deleteSavingsAccount(id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Investments", "Inversiones")}
        description={
          loading
            ? t(
                "Manual-first portfolio tracking across brokers, Colombian stocks, US assets, and crypto.",
                "Seguimiento manual del portafolio entre brokers, acciones colombianas, activos de EE. UU. y cripto."
              )
            : t(
                `${overview.openPositionsCount} open position${overview.openPositionsCount !== 1 ? "s" : ""} · ${watchlist.length} watchlist asset${watchlist.length !== 1 ? "s" : ""}`,
                `${overview.openPositionsCount} posición${overview.openPositionsCount !== 1 ? "es" : ""} abierta${overview.openPositionsCount !== 1 ? "s" : ""} · ${watchlist.length} activo${watchlist.length !== 1 ? "s" : ""} en seguimiento`
              )
        }
      >
        <TradeForm
          accounts={accounts}
          lookupPrice={lookupMarketPrice}
          onSubmit={addTrade}
        />
        <BrokerageAccountForm onSubmit={addBrokerageAccount} />
      </PageHeader>

      {accounts.length === 0 && !loading ? (
        <Card className="border-border/80 bg-card/96">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                {t("Add positions directly", "Agrega posiciones directamente")}
              </p>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {t(
                  "Pick a broker like Trii, Interactive Brokers, Hapi, or any custom broker, enter the asset, quantity, and price, and the app will create the saved broker entry automatically if it does not exist yet.",
                  "Elige un broker como Trii, Interactive Brokers, Hapi u otro personalizado, ingresa el activo, cantidad y precio, y la app creará automáticamente el registro del broker si aún no existe."
                )}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
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
          <TabsTrigger value="savings">{t("Savings", "Ahorros")}</TabsTrigger>
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

          <Card className="border-border/80 bg-card/96">
            <CardHeader className="border-b border-border/70">
              <CardTitle>
                {t("Total investment net worth", "Patrimonio total de inversiones")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Stocks", "Stocks")}
                  </p>
                  <p className="mt-3 font-heading text-[1.55rem] font-semibold leading-none tracking-[-0.04em]">
                    {formatCurrency(overview.totalMarketValue, baseCurrency)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Savings accounts", "Cuentas de ahorro")}
                  </p>
                  <p className="mt-3 font-heading text-[1.55rem] font-semibold leading-none tracking-[-0.04em]">
                    {formatCurrency(totalSavingsBalance, baseCurrency)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Total in base", "Total en base")}
                  </p>
                  <p className="mt-3 font-heading text-[1.55rem] font-semibold leading-none tracking-[-0.04em]">
                    {formatCurrency(
                      overview.totalMarketValue + totalSavingsBalance,
                      baseCurrency
                    )}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Savings accounts", "Cuentas")}
                  </p>
                  <p className="mt-3 font-heading text-[1.55rem] font-semibold leading-none tracking-[-0.04em]">
                    {savingsAccounts.length}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {savingsTotalsByCurrency.map((item) => (
                  <div
                    key={item.currency}
                    className="rounded-[1.2rem] border border-border/70 bg-secondary/25 p-4"
                  >
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                      {t("Total at today's rate", "Total a tasa del día")} ·{" "}
                      {item.currency}
                    </p>
                    <p className="mt-3 font-heading text-[1.45rem] font-semibold leading-none tracking-[-0.04em]">
                      {formatCurrency(item.total, item.currency)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t(
                        `Stocks ${formatCurrency(item.stocksValue, item.currency)} + savings ${formatCurrency(item.savingsValue, item.currency)}`,
                        `Stocks ${formatCurrency(item.stocksValue, item.currency)} + ahorros ${formatCurrency(item.savingsValue, item.currency)}`
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_380px]">
            <HoldingsTable holdings={overview.holdings} />

            <div className="space-y-5">
              <Card className="border-border/80 bg-card/96">
                <CardHeader className="border-b border-border/70">
                  <CardTitle>{t("Broker summary", "Resumen por broker")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] border border-border/70 bg-secondary/35 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("Estimated cash", "Caja estimada")}
                      </p>
                      <p className="mt-3 font-heading text-[1.5rem] font-semibold leading-none tracking-[-0.04em]">
                        {formatCurrency(overview.estimatedCash, baseCurrency)}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-border/70 bg-secondary/35 p-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                        {t("Net contributions", "Aportes netos")}
                      </p>
                      <p className="mt-3 font-heading text-[1.5rem] font-semibold leading-none tracking-[-0.04em]">
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

              <Card className="border-border/80 bg-card/96">
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
                        className="rounded-[1.25rem] border border-border/70 bg-secondary/25 p-4"
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
                          {t("Fee mode", "Modo de comisión")}:{" "}
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
          <div className="rounded-[1.65rem] border border-border/80 bg-card/96 p-4 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.86)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="flex-1 space-y-2">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
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
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
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
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
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
            <Card className="border-border/80 bg-card/96">
              <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Estimated cash", "Caja estimada")}
                  </p>
                  <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                    {formatCurrency(overview.estimatedCash, baseCurrency)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Net contributions", "Aportes netos")}
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

        <TabsContent value="savings" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <Card className="border-border/80 bg-card/96">
              <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Savings balance", "Saldo de ahorros")}
                  </p>
                  <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                    {formatCurrency(totalSavingsBalance, baseCurrency)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Accounts configured", "Cuentas configuradas")}
                  </p>
                  <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                    {savingsAccounts.length}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Movements", "Movimientos")}
                  </p>
                  <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                    {savingsTransfers.length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-2 sm:flex-row">
              <SavingsAccountForm onSubmit={addSavingsAccount} />
              <SavingsTransferForm
                accounts={savingsAccounts}
                onSubmit={addSavingsTransfer}
              />
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_420px]">
            <SavingsTransferTable
              transfers={savingsTransfers}
              accounts={savingsAccounts}
              loading={loading}
              onUpdate={updateSavingsTransfer}
              onDelete={deleteSavingsTransfer}
            />

            <Card className="border-border/80 bg-card/96">
              <CardHeader className="border-b border-border/70">
                <CardTitle>
                  {t("Savings accounts", "Cuentas de ahorro")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {savingsAccountSummaries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "Add your first savings account in Colombia or Spain and start tracking transfers.",
                      "Agrega tu primera cuenta de ahorro en Colombia o España y comienza a rastrear transferencias."
                    )}
                  </p>
                ) : (
                  savingsAccountSummaries.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-[1.25rem] border border-border/70 bg-secondary/25 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {buildSavingsAccountLabel({
                              bankName: account.bank_name,
                              productName: account.product_name,
                              accountName: account.account_name,
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {account.country_code} · {account.currency}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <SavingsAccountForm
                            defaultValues={{
                              country_code: account.country_code as "CO" | "ES",
                              bank_code: account.bank_code,
                              bank_name: account.bank_name,
                              product_type: account.product_type as
                                | "savings_account"
                                | "checking_account"
                                | "fiduciary_account",
                              product_name: account.product_name,
                              account_name: account.account_name,
                              currency: account.currency,
                            }}
                            onSubmit={(values) =>
                              updateSavingsAccount(account.id, values)
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
                            onClick={() =>
                              void handleDeleteSavingsAccount(account.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {t("Tracked balance", "Saldo rastreado")}:{" "}
                        {formatCurrency(account.balance, baseCurrency)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <Card className="border-border/80 bg-card/96">
              <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Watchlist assets", "Activos en seguimiento")}
                  </p>
                  <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                    {overview.watchlistCount}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                    {t("Tracked assets", "Activos rastreados")}
                  </p>
                  <p className="mt-3 font-heading text-[1.6rem] font-semibold leading-none tracking-[-0.04em]">
                    {overview.trackedAssetsCount}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-secondary/35 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
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

      {accounts.length === 0 && !loading ? (
        <Card className="border-border/80 bg-card/96">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 rounded-[1.25rem] border border-border/70 bg-secondary/35 p-4">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm leading-6 text-muted-foreground">
                {t(
                  "Broker entries are lightweight now. Save a position first, then adjust broker defaults later if you want.",
                  "Los registros de broker son simples al inicio. Guarda primero una posición y luego ajusta los valores por defecto si quieres."
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
