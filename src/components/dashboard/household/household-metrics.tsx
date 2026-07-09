"use client";

import { useMemo } from "react";
import Link from "next/link";
import { HandCoins, Landmark, PiggyBank, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FxExposureCard } from "@/components/dashboard/household/fx-exposure-card";
import { useHouseholdInsights } from "@/hooks/use-household-insights";
import { useInvestments } from "@/hooks/use-investments";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

function percent(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

/**
 * The stewardship numbers, composed once: three-pillar rates (giving,
 * spending, savings — they sum to 100% of trailing-12M income), liquidity
 * runway, net worth, and FX exposure. When inputs are missing (untagged
 * categories, no income) the cards prompt instead of showing a fake number.
 */
export function HouseholdMetrics() {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
  const { insights, loading } = useHouseholdInsights();
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

  if (loading || investmentsLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-[calc(var(--radius)*1.35)] bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!insights) return null;

  const liquidReserves = totalSavingsBalance + overview.estimatedCash;
  const runwayMonths =
    insights.hasEssentialData &&
    insights.essentialMonthlyAvg &&
    insights.essentialMonthlyAvg > 0
      ? liquidReserves / insights.essentialMonthlyAvg
      : null;

  const netWorth =
    overview.totalMarketValue +
    overview.estimatedCash +
    totalSavingsBalance -
    insights.totalLiabilitiesBase;

  const givingOnTarget =
    insights.givingRate !== null &&
    insights.givingRate * 100 >= insights.titheTargetPercent;

  return (
    <section className="space-y-4">
      <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
        {t("Household stewardship — trailing 12 months", "Mayordomía del hogar — últimos 12 meses")}
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Three-pillar rates */}
        <Card>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                {t("Giving · Spending · Saving", "Dar · Gastar · Ahorrar")}
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <HandCoins className="h-4 w-4 text-muted-foreground" />
              </span>
            </div>
            {insights.givingRate === null ? (
              <p className="text-sm text-muted-foreground">
                {t(
                  "No income recorded yet in this window.",
                  "Aún no hay ingresos registrados en este periodo."
                )}
              </p>
            ) : (
              <>
                <div className="flex items-baseline gap-3 font-heading leading-none tracking-[-0.045em]">
                  <span
                    className={`text-[1.6rem] ${givingOnTarget ? "text-emerald-300" : ""}`}
                  >
                    {percent(insights.givingRate)}
                  </span>
                  <span className="text-[1.6rem] text-muted-foreground">
                    {percent(insights.spendingRate)}
                  </span>
                  <span className="text-[1.6rem]">
                    {percent(insights.savingsRate)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    `Giving target ${insights.titheTargetPercent}% · the three sum to 100% of income`,
                    `Meta de dar ${insights.titheTargetPercent}% · los tres suman el 100% del ingreso`
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Liquidity runway */}
        <Card>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                {t("Liquidity runway", "Colchón de liquidez")}
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <Timer className="h-4 w-4 text-muted-foreground" />
              </span>
            </div>
            {runwayMonths === null ? (
              <p className="text-sm text-muted-foreground">
                {t("Tag your essential categories in", "Etiqueta tus categorías esenciales en")}{" "}
                <Link href="/settings" className="underline underline-offset-2">
                  {t("Settings", "Ajustes")}
                </Link>{" "}
                {t("to compute this.", "para calcular esto.")}
              </p>
            ) : (
              <>
                <p className="font-heading text-[2.15rem] leading-none tracking-[-0.045em]">
                  {runwayMonths.toFixed(1)}{" "}
                  <span className="text-base text-muted-foreground">
                    {t("months", "meses")}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(liquidReserves, baseCurrency)}{" "}
                  {t("liquid ÷", "líquidos ÷")}{" "}
                  {formatCurrency(insights.essentialMonthlyAvg ?? 0, baseCurrency)}
                  {t("/month essential", "/mes esencial")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Net worth */}
        <Card>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                {t("Net worth", "Patrimonio neto")}
              </p>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  netWorth >= 0 ? "bg-emerald-500/10" : "bg-destructive/10"
                }`}
              >
                <Landmark
                  className={`h-4 w-4 ${netWorth >= 0 ? "text-emerald-300" : "text-destructive"}`}
                />
              </span>
            </div>
            <p className="font-heading text-[2.15rem] leading-none tracking-[-0.045em]">
              {formatCurrency(netWorth, baseCurrency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("Investments + cash + savings − debts", "Inversiones + efectivo + ahorros − deudas")}
              {insights.totalLiabilitiesBase > 0 &&
                ` (${formatCurrency(insights.totalLiabilitiesBase, baseCurrency)} ${t("debt", "deuda")})`}
              {!insights.settingsAvailable &&
                ` · ${t("liabilities pending migration", "pasivos pendientes de migración")}`}
            </p>
          </CardContent>
        </Card>

        {/* Savings amount (12M) */}
        <Card>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                {t("Kept in 12 months", "Guardado en 12 meses")}
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </span>
            </div>
            <p className="font-heading text-[2.15rem] leading-none tracking-[-0.045em]">
              {formatCurrency(
                Math.max(insights.income12M - insights.expenses12M, 0),
                baseCurrency
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(insights.income12M, baseCurrency)}{" "}
              {t("earned −", "ganado −")}{" "}
              {formatCurrency(insights.expenses12M, baseCurrency)}{" "}
              {t("out (incl. giving)", "salido (incl. dar)")}
            </p>
          </CardContent>
        </Card>
      </div>

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
    </section>
  );
}
