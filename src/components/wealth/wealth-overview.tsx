"use client";

import { useMemo, useState } from "react";
import { CreditCard, Wallet } from "lucide-react";
import { useHouseholdInsights } from "@/hooks/use-household-insights";
import { useInvestments } from "@/hooks/use-investments";
import { useNetWorth } from "@/hooks/use-net-worth";
import { useWealthAccounts } from "@/hooks/use-wealth-accounts";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { formatCurrency } from "@/lib/utils";
import type { WealthCategory } from "@/lib/palette";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { UnderlineTabs } from "@/components/patterns/underline-tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetsDebtsCard } from "@/components/wealth/assets-debts-card";
import { CushionCard } from "@/components/wealth/cushion-card";
import { FxExposureCard } from "@/components/wealth/fx-exposure-card";
import { NetWorthTrendCard } from "@/components/wealth/net-worth-trend-card";
import { OrganizeMoneyGrid } from "@/components/wealth/organize-money-grid";
import { PatrimonioHero } from "@/components/wealth/patrimonio-hero";
import {
  WealthBreakdownList,
  type BreakdownRow,
} from "@/components/wealth/wealth-breakdown-list";
import { WealthEmptyPreview } from "@/components/wealth/wealth-empty-preview";

type WealthTab = "summary" | "assets" | "debts";

/**
 * Patrimonio — the personal balance sheet.
 *
 * Orchestration only: every figure comes from `useNetWorth()` so no surface
 * re-derives a total, and every card below takes plain props.
 */
export function WealthOverview() {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();
  const [tab, setTab] = useState<WealthTab>("summary");

  const { totals, monthlyChange, cushion, snapshots, counts, isEmpty, loading } =
    useNetWorth();

  const { insights } = useHouseholdInsights();
  const { overview, savingsTransfers, accounts } = useInvestments({
    includeTrades: false,
    includeCash: false,
    includeSavings: true,
    includeWatchlist: false,
  });
  const { activeAccounts } = useWealthAccounts();

  const accountCurrencies = useMemo(
    () =>
      Object.fromEntries(
        accounts.map((account) => [account.id, account.account_currency])
      ),
    [accounts]
  );

  const categoryTotals = useMemo<Record<WealthCategory, number>>(
    () => ({
      accounts: totals.accountsAndCash,
      savings: totals.savings,
      investments: totals.investments,
      lent: totals.moneyLent,
      debts: totals.debts,
    }),
    [totals]
  );

  const categoryCounts = useMemo<Record<WealthCategory, number>>(
    () => ({
      accounts: counts.accounts,
      savings: counts.savings,
      investments: counts.investments,
      lent: counts.loans,
      debts: counts.debts,
    }),
    [counts]
  );

  const assetRows = useMemo<BreakdownRow[]>(
    () => [
      {
        key: "accounts",
        category: "accounts",
        label: t("Accounts & cash", "Cuentas y efectivo"),
        detail: t(
          `${counts.accounts} ${counts.accounts === 1 ? "account" : "accounts"}`,
          `${counts.accounts} ${counts.accounts === 1 ? "cuenta" : "cuentas"}`
        ),
        value: totals.accountsAndCash,
        href: "/wealth/accounts",
      },
      {
        key: "savings",
        category: "savings",
        label: t("Savings", "Ahorros"),
        detail: t(
          `${counts.savings} ${counts.savings === 1 ? "fund" : "funds"}`,
          `${counts.savings} ${counts.savings === 1 ? "fondo" : "fondos"}`
        ),
        value: totals.savings,
        href: "/wealth/savings",
      },
      {
        key: "investments",
        category: "investments",
        label: t("Investments", "Inversiones"),
        detail: t(
          `${counts.investments} ${counts.investments === 1 ? "position" : "positions"}`,
          `${counts.investments} ${counts.investments === 1 ? "posición" : "posiciones"}`
        ),
        value: totals.investments,
        href: "/wealth/investments",
      },
      {
        key: "lent",
        category: "lent",
        label: t("Money lent", "Dinero prestado"),
        detail: t(
          `${counts.loans} ${counts.loans === 1 ? "loan" : "loans"}`,
          `${counts.loans} ${counts.loans === 1 ? "préstamo" : "préstamos"}`
        ),
        value: totals.moneyLent,
        href: "/wealth/loans",
      },
    ],
    [t, totals, counts]
  );

  const debtRows = useMemo<BreakdownRow[]>(
    () =>
      (insights?.liabilities ?? [])
        .filter((liability) => liability.isActive)
        .map((liability) => ({
          key: liability.id,
          category: "debts" as const,
          label: liability.name,
          detail:
            liability.interestRatePercent !== null
              ? `${liability.interestRatePercent}% ${t("APR", "TAE")}`
              : undefined,
          value: liability.currentBalanceBase,
          href: "/wealth/liabilities",
        })),
    [insights?.liabilities, t]
  );

  if (loading) {
    return (
      <Screen title={t("Net worth", "Patrimonio")}>
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-44 rounded-xl" />
      </Screen>
    );
  }

  return (
    <Screen
      title={t("Net worth", "Patrimonio")}
      subheader={
        <p className="text-caption text-muted-foreground">
          {t(
            "Assets, savings and debts in one place.",
            "Activos, ahorros y deudas en un solo lugar."
          )}
        </p>
      }
    >
      <PatrimonioHero
        totals={totals}
        monthlyChange={monthlyChange}
        isEmpty={isEmpty}
        addHref="/wealth/accounts"
      />

      {isEmpty ? (
        <>
          <OrganizeMoneyGrid
            totals={categoryTotals}
            counts={categoryCounts}
            isEmpty
          />
          <div className="grid gap-3 lg:grid-cols-2">
            <WealthEmptyPreview />
            <Card>
              <CardHeader>
                <SectionHeader
                  eyebrow={t("Currency", "Moneda")}
                  title={t("By currency", "Distribución por moneda")}
                />
              </CardHeader>
              <CardContent>
                <p className="py-8 text-center text-caption text-muted-foreground">
                  {t(
                    "Appears once you add your first account.",
                    "Aparecerá cuando añadas tu primera cuenta."
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <UnderlineTabs
            tabs={[
              { key: "summary" as const, label: t("Summary", "Resumen") },
              { key: "assets" as const, label: t("Assets", "Activos") },
              { key: "debts" as const, label: t("Debts", "Deudas") },
            ]}
            value={tab}
            onChange={setTab}
            ariaLabel={t("Net worth views", "Vistas de patrimonio")}
          />

          {tab === "summary" && (
            <>
              <div className="grid gap-3 lg:grid-cols-3">
                <NetWorthTrendCard snapshots={snapshots} />
                <AssetsDebtsCard totals={totals} />
                <CushionCard
                  cushion={cushion}
                  liquidBase={
                    totals.accountsAndCash +
                    totals.savings +
                    overview.estimatedCash
                  }
                />
              </div>

              <OrganizeMoneyGrid
                totals={categoryTotals}
                counts={categoryCounts}
                isEmpty={false}
              />

              {insights && (
                <Card>
                  <CardHeader>
                    <SectionHeader
                      eyebrow={t("Currency", "Moneda")}
                      title={t("By currency", "Distribución por moneda")}
                    />
                  </CardHeader>
                  <CardContent>
                    <FxExposureCard
                      variant="bare"
                      holdings={overview.holdings}
                      accountSummaries={overview.accountSummaries}
                      accountCurrencies={accountCurrencies}
                      savingsTransfers={[
                        ...savingsTransfers.map((transfer) => ({
                          amount: Number(transfer.amount),
                          currency: transfer.currency,
                        })),
                        ...activeAccounts.map((account) => ({
                          amount: account.balance,
                          currency: account.currency,
                        })),
                      ]}
                      liabilitiesByCurrency={insights.liabilitiesByCurrency}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {tab === "assets" && (
            <WealthBreakdownList
              eyebrow={t("Owned", "Lo que tienes")}
              title={t("Assets", "Activos")}
              rows={assetRows}
              total={totals.totalAssets}
              totalLabel={t("Total assets", "Total activos")}
              emptyIcon={Wallet}
              emptyTitle={t("No assets yet", "Aún no tienes activos")}
              emptyDescription={t(
                "Add an account, a savings fund or an investment to get started.",
                "Añade una cuenta, un fondo de ahorro o una inversión para empezar."
              )}
            />
          )}

          {tab === "debts" && (
            <WealthBreakdownList
              eyebrow={t("Owed", "Lo que debes")}
              title={t("Debts", "Deudas")}
              rows={debtRows}
              total={totals.totalLiabilities}
              totalLabel={t("Total debt", "Deuda total")}
              emptyIcon={CreditCard}
              emptyTitle={t("No debts recorded", "Sin deudas registradas")}
              emptyDescription={t(
                "Nothing owed — or nothing added yet.",
                "No debes nada, o aún no lo has añadido."
              )}
            />
          )}
        </>
      )}

      {!isEmpty && tab === "summary" && totals.totalAssets > 0 && (
        <p className="px-1 text-caption text-muted-foreground">
          {t(
            `Net worth is everything you own minus everything you owe. It is not spendable money — ${formatCurrency(totals.investments, baseCurrency)} of it is invested.`,
            `El patrimonio neto es todo lo que tienes menos lo que debes. No es dinero disponible — ${formatCurrency(totals.investments, baseCurrency)} están invertidos.`
          )}
        </p>
      )}
    </Screen>
  );
}
