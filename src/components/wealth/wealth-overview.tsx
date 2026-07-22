"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Banknote,
  Landmark,
  PiggyBank,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useHouseholdInsights } from "@/hooks/use-household-insights";
import { useInvestments } from "@/hooks/use-investments";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { cn, formatCurrency } from "@/lib/utils";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { BreakdownDonut, type DonutSlice } from "@/components/patterns/breakdown-donut";
import { WealthNav } from "@/components/wealth/wealth-nav";
import { FxExposureCard } from "@/components/wealth/fx-exposure-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/types/database";

type Loan = Database["public"]["Tables"]["loans"]["Row"];
type LoanRepayment = Database["public"]["Tables"]["loan_repayments"]["Row"];

/**
 * Wealth overview: what you own and owe, in one glance — net worth,
 * allocation across investments/cash/savings, runway, debts, FX exposure.
 */
export function WealthOverview() {
  const { t } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const { insights, loading: insightsLoading } = useHouseholdInsights();
  const {
    overview,
    accounts,
    savingsTransfers,
    totalSavingsBalance,
    loading: investmentsLoading,
  } = useInvestments();

  const { data: loansData, isPending: loansLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: () =>
      authorizedFetch<{ loans: Loan[]; repayments: LoanRepayment[] }>(
        "/api/loans"
      ),
  });

  const loansOutstandingBase = useMemo(() => {
    if (!loansData) return 0;
    return loansData.loans
      .filter((loan) => loan.is_active)
      .reduce((sum, loan) => {
        const repaid = loansData.repayments
          .filter((repayment) => repayment.loan_id === loan.id)
          .reduce((paid, repayment) => paid + Number(repayment.amount), 0);
        const outstanding = Math.max(Number(loan.principal) - repaid, 0);
        return sum + convert(outstanding, loan.currency);
      }, 0);
  }, [loansData, convert]);

  const accountCurrencies = useMemo(
    () =>
      Object.fromEntries(
        accounts.map((account) => [account.id, account.account_currency])
      ),
    [accounts]
  );

  const loading = insightsLoading || investmentsLoading || loansLoading;

  const liabilitiesTotal = insights?.totalLiabilitiesBase ?? 0;
  const liquidReserves = totalSavingsBalance + overview.estimatedCash;
  const totalAssets =
    overview.totalMarketValue +
    overview.estimatedCash +
    totalSavingsBalance +
    loansOutstandingBase;
  const netWorth = totalAssets - liabilitiesTotal;

  const runwayMonths =
    insights?.hasEssentialData &&
    insights.essentialMonthlyAvg &&
    insights.essentialMonthlyAvg > 0
      ? liquidReserves / insights.essentialMonthlyAvg
      : null;

  const allocation: DonutSlice[] = [
    {
      id: "investments",
      name: t("Investments", "Inversiones"),
      value: overview.totalMarketValue,
      color: "var(--chart-1)",
    },
    {
      id: "savings",
      name: t("Savings", "Ahorros"),
      value: totalSavingsBalance,
      color: "var(--chart-2)",
    },
    {
      id: "cash",
      name: t("Broker cash", "Caja de broker"),
      value: overview.estimatedCash,
      color: "var(--chart-3)",
    },
    {
      id: "loans",
      name: t("Loans lent", "Préstamos"),
      value: loansOutstandingBase,
      color: "var(--chart-4)",
    },
  ].filter((slice) => slice.value > 0);

  const stats = [
    {
      key: "runway",
      label: t("Cash runway", "Meses de colchón"),
      icon: Timer,
      value:
        runwayMonths !== null
          ? `${runwayMonths.toFixed(1)} ${t("mo", "mes")}`
          : "—",
      detail:
        runwayMonths !== null
          ? t(
              `${formatCurrency(liquidReserves, baseCurrency)} liquid`,
              `${formatCurrency(liquidReserves, baseCurrency)} líquidos`
            )
          : t("Tag essentials in Settings", "Etiqueta esenciales en Ajustes"),
      href: undefined as string | undefined,
      tone: "default" as "default" | "negative",
    },
    {
      key: "loans",
      label: t("Loans lent", "Préstamos"),
      icon: Banknote,
      value: formatCurrency(loansOutstandingBase, baseCurrency),
      detail: t("Money others owe you", "Lo que te deben"),
      href: "/wealth/loans",
      tone: "default" as const,
    },
    {
      key: "debts",
      label: t("Debts", "Deudas"),
      icon: Landmark,
      value: formatCurrency(liabilitiesTotal, baseCurrency),
      detail: t("Loans, mortgages, credit", "Préstamos, hipotecas, crédito"),
      href: "/wealth/liabilities",
      tone: liabilitiesTotal > 0 ? ("negative" as const) : ("default" as const),
    },
  ];

  return (
    <Screen title={t("Wealth", "Patrimonio")} subheader={<WealthNav />}>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Net worth + allocation, together */}
          <Card>
            <CardContent className="space-y-6 py-6">
              <div className="space-y-1">
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
                  {formatCurrency(totalAssets, baseCurrency)}{" "}
                  {t("in assets", "en activos")}
                  {liabilitiesTotal > 0 &&
                    ` − ${formatCurrency(liabilitiesTotal, baseCurrency)} ${t("debt", "deuda")}`}
                </p>
              </div>

              {allocation.length > 0 && (
                <div className="border-t border-border/60 pt-5">
                  <p className="label-caps mb-3">
                    {t("Allocation", "Distribución")}
                  </p>
                  <BreakdownDonut
                    slices={allocation}
                    centerLabel={t("Assets", "Activos")}
                    centerValue={totalAssets}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => {
              const body = (
                <Card
                  size="sm"
                  className={cn(
                    "h-full min-w-0 justify-between gap-2 px-3.5",
                    stat.href &&
                      "transition-all duration-200 hover:shadow-2 hover:ring-border/80"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="label-caps truncate">{stat.label}</p>
                    <stat.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate font-mono text-heading font-semibold tabular-nums",
                        stat.tone === "negative" && "text-negative"
                      )}
                    >
                      {stat.value}
                    </p>
                    <p className="mt-0.5 truncate text-caption text-muted-foreground">
                      {stat.detail}
                    </p>
                  </div>
                </Card>
              );
              return stat.href ? (
                <Link key={stat.key} href={stat.href} className="block min-w-0">
                  {body}
                </Link>
              ) : (
                <div key={stat.key} className="min-w-0">
                  {body}
                </div>
              );
            })}
          </div>

          {/* Jump-in links to the sub-sections */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                {
                  href: "/wealth/investments",
                  label: t("Investments", "Inversiones"),
                  value: formatCurrency(overview.totalMarketValue, baseCurrency),
                  icon: TrendingUp,
                },
                {
                  href: "/wealth/savings",
                  label: t("Savings", "Ahorros"),
                  value: formatCurrency(totalSavingsBalance, baseCurrency),
                  icon: PiggyBank,
                },
                {
                  href: "/wealth/loans",
                  label: t("Loans", "Préstamos"),
                  value: formatCurrency(loansOutstandingBase, baseCurrency),
                  icon: Banknote,
                },
                {
                  href: "/wealth/liabilities",
                  label: t("Debts", "Deudas"),
                  value: formatCurrency(liabilitiesTotal, baseCurrency),
                  icon: Landmark,
                },
              ] as const
            ).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-xl bg-card px-4 py-3.5 ring-1 ring-border shadow-1 transition-all hover:shadow-2 hover:ring-border/80"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <link.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium">{link.label}</p>
                  <p className="truncate font-mono text-caption tabular-nums text-muted-foreground">
                    {link.value}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>

          {/* FX exposure */}
          {insights && (
            <Card>
              <CardHeader>
                <SectionHeader
                  eyebrow={t("Currency", "Moneda")}
                  title={t("By currency", "Por divisa")}
                />
              </CardHeader>
              <CardContent>
                <FxExposureCard
                  variant="bare"
                  holdings={overview.holdings}
                  accountSummaries={overview.accountSummaries}
                  accountCurrencies={accountCurrencies}
                  savingsTransfers={savingsTransfers.map((transfer) => ({
                    amount: Number(transfer.amount),
                    currency: transfer.currency,
                  }))}
                  liabilitiesByCurrency={insights.liabilitiesByCurrency}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
