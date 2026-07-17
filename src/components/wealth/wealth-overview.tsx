"use client";

import { useMemo } from "react";
import { Landmark, PiggyBank, Timer } from "lucide-react";
import { useHouseholdInsights } from "@/hooks/use-household-insights";
import { useInvestments } from "@/hooks/use-investments";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { cn, formatCurrency } from "@/lib/utils";
import { Screen } from "@/components/patterns/screen";
import { StatCard } from "@/components/patterns/stat-card";
import { WealthNav } from "@/components/wealth/wealth-nav";
import { FxExposureCard } from "@/components/wealth/fx-exposure-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Wealth overview: what you own and owe, in one glance — net worth,
 * allocation across investments/cash/savings, runway, debts, FX exposure.
 */
export function WealthOverview() {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
  const { insights, loading: insightsLoading } = useHouseholdInsights();
  const {
    overview,
    accounts,
    savingsTransfers,
    totalSavingsBalance,
    loading: investmentsLoading,
  } = useInvestments();

  const accountCurrencies = useMemo(
    () =>
      Object.fromEntries(
        accounts.map((account) => [account.id, account.account_currency])
      ),
    [accounts]
  );

  const loading = insightsLoading || investmentsLoading;

  const liabilitiesTotal = insights?.totalLiabilitiesBase ?? 0;
  const liquidReserves = totalSavingsBalance + overview.estimatedCash;
  const netWorth =
    overview.totalMarketValue +
    overview.estimatedCash +
    totalSavingsBalance -
    liabilitiesTotal;

  const runwayMonths =
    insights?.hasEssentialData &&
    insights.essentialMonthlyAvg &&
    insights.essentialMonthlyAvg > 0
      ? liquidReserves / insights.essentialMonthlyAvg
      : null;

  const keptIn12M = insights
    ? Math.max(insights.income12M - insights.expenses12M, 0)
    : 0;

  const allocation = [
    {
      key: "investments",
      label: t("Investments", "Inversiones"),
      value: overview.totalMarketValue,
      color: "var(--chart-1)",
    },
    {
      key: "savings",
      label: t("Savings", "Ahorros"),
      value: totalSavingsBalance,
      color: "var(--chart-2)",
    },
    {
      key: "cash",
      label: t("Broker cash", "Caja de broker"),
      value: overview.estimatedCash,
      color: "var(--chart-3)",
    },
  ].filter((slice) => slice.value > 0);
  const allocationTotal = allocation.reduce(
    (sum, slice) => sum + slice.value,
    0
  );

  return (
    <Screen title={t("Wealth", "Patrimonio")} subheader={<WealthNav />}>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Net worth hero */}
          <Card>
            <CardContent className="space-y-4 py-6">
              <div className="space-y-1.5">
                <p className="label-caps">{t("Net worth", "Patrimonio neto")}</p>
                <p
                  className={cn(
                    "font-mono text-display tabular-nums",
                    netWorth >= 0 ? "text-foreground" : "text-negative"
                  )}
                >
                  {formatCurrency(netWorth, baseCurrency)}
                </p>
                <p className="text-caption text-muted-foreground">
                  {t(
                    "Investments + cash + savings − debts",
                    "Inversiones + efectivo + ahorros − deudas"
                  )}
                  {liabilitiesTotal > 0 &&
                    ` (${formatCurrency(liabilitiesTotal, baseCurrency)} ${t("debt", "deuda")})`}
                </p>
              </div>

              {allocationTotal > 0 && (
                <div className="space-y-2">
                  <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
                    {allocation.map((slice) => (
                      <div
                        key={slice.key}
                        style={{
                          width: `${(slice.value / allocationTotal) * 100}%`,
                          backgroundColor: slice.color,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {allocation.map((slice) => (
                      <span
                        key={slice.key}
                        className="inline-flex items-center gap-1.5 text-caption text-muted-foreground"
                      >
                        <span
                          aria-hidden
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: slice.color }}
                        />
                        {slice.label}{" "}
                        <span className="font-mono tabular-nums text-foreground">
                          {formatCurrency(slice.value, baseCurrency)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stat row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard
              label={t("Liquidity runway", "Colchón de liquidez")}
              icon={<Timer className="h-4 w-4" />}
              value={
                <span className="font-mono text-heading font-semibold tabular-nums">
                  {runwayMonths !== null
                    ? `${runwayMonths.toFixed(1)} ${t("months", "meses")}`
                    : "—"}
                </span>
              }
              detail={
                runwayMonths !== null
                  ? t(
                      `${formatCurrency(liquidReserves, baseCurrency)} liquid ÷ essential burn`,
                      `${formatCurrency(liquidReserves, baseCurrency)} líquidos ÷ gasto esencial`
                    )
                  : t(
                      "Tag essential categories in Settings",
                      "Etiqueta categorías esenciales en Ajustes"
                    )
              }
            />
            <StatCard
              label={t("Debts", "Deudas")}
              icon={<Landmark className="h-4 w-4" />}
              value={
                <span
                  className={cn(
                    "font-mono text-heading font-semibold tabular-nums",
                    liabilitiesTotal > 0 && "text-negative"
                  )}
                >
                  {formatCurrency(liabilitiesTotal, baseCurrency)}
                </span>
              }
              detail={t("Loans, mortgages, credit", "Préstamos, hipotecas, crédito")}
              href="/wealth/liabilities"
            />
            <StatCard
              label={t("Kept in 12 months", "Guardado en 12 meses")}
              icon={<PiggyBank className="h-4 w-4" />}
              value={
                <span className="font-mono text-heading font-semibold tabular-nums">
                  {formatCurrency(keptIn12M, baseCurrency)}
                </span>
              }
              detail={
                insights
                  ? t(
                      `${formatCurrency(insights.income12M, baseCurrency)} earned − ${formatCurrency(insights.expenses12M, baseCurrency)} out`,
                      `${formatCurrency(insights.income12M, baseCurrency)} ganado − ${formatCurrency(insights.expenses12M, baseCurrency)} salido`
                    )
                  : undefined
              }
              className="col-span-2 lg:col-span-1"
            />
          </div>

          {/* FX exposure */}
          {insights && (
            <FxExposureCard
              holdings={overview.holdings}
              accountSummaries={overview.accountSummaries}
              accountCurrencies={accountCurrencies}
              savingsTransfers={savingsTransfers.map((transfer) => ({
                amount: Number(transfer.amount),
                currency: transfer.currency,
              }))}
              liabilitiesByCurrency={insights.liabilitiesByCurrency}
            />
          )}
        </>
      )}
    </Screen>
  );
}
