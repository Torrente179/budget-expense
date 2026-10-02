"use client";

import { ChevronRight } from "lucide-react";
import { SPEND_CHART_COLOR } from "@/components/charts/chart-theme";
import { BudgetSummaryFigure } from "@/components/budget/budget-summary-figure";
import { TrackerWallet } from "@/components/budget/tracker-wallet";
import { HomeActivitySheet } from "@/components/home/home-activity-sheet";
import { HomeBalanceCard } from "@/components/home/home-balance-card";
import { TrackerPills } from "@/components/home/tracker-pills";
import { WEALTH_ACCENTS } from "@/lib/palette";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import {
  DEMO_CURRENCY,
  demoBalance,
  demoCashflow,
  demoFeedDays,
  demoMoneyOut,
  demoNetWorth,
  demoNetWorthChange,
  demoSpendCategories,
  demoSpendMonths,
  demoTrackers,
  demoUpcoming,
  demoWealthBuckets,
} from "@/components/landing/demo-data";
import {
  DemoChrome,
  DemoHero,
  DemoRail,
  DemoSheet,
  DemoStatusBar,
  DemoTabBar,
} from "@/components/landing/screens/screen-chrome";

/**
 * The four screens shown on the public page.
 *
 * Wherever the app has a component that is free of viewport breakpoints, the
 * screen renders that component rather than a copy of it — `HomeBalanceCard`,
 * `TrackerPills` and `HomeActivitySheet` for Home, `TrackerWallet` for Budget. When those change, the
 * landing page changes with them, which is the whole point: a marketing
 * screenshot that can go stale is a marketing screenshot that will.
 */

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-0 flex flex-col">{children}</div>;
}

export function HomeDemoScreen() {
  return (
    <Frame>
      <DemoStatusBar />
      <DemoRail activeKey="home" />
      <div className="flex-1 overflow-hidden pt-4">
        <HomeBalanceCard
          cashflow={demoCashflow}
          availableBalance={demoBalance}
          className="mx-5"
        />
        <TrackerPills
          budgets={demoTrackers.map((row) => ({
            id: row.id,
            name: row.name,
            limit: row.target,
            spent: row.progressAmount,
            ratio: row.ratio,
            icon: row.icon,
            color: row.color,
          }))}
          className="mt-5 px-5"
        />
        <HomeActivitySheet
          feedDays={demoFeedDays}
          upcoming={demoUpcoming}
          className="mt-6 px-1"
        />
      </div>
      <DemoTabBar activeKey="home" />
    </Frame>
  );
}

export function BudgetDemoScreen() {
  const { t, intlLocale } = useLocale();
  const limit = demoTrackers.reduce((sum, row) => sum + row.target, 0);
  const spent = demoTrackers.reduce((sum, row) => sum + row.progressAmount, 0);

  return (
    <Frame>
      <DemoStatusBar />
      <DemoRail activeKey="budget" />
      <div className="flex-1 overflow-hidden px-5 pt-3">
        <div className="flex gap-6 border-b border-border">
          <span className="-mb-px flex min-h-11 items-center border-b-2 border-primary text-base font-extrabold">
            {t("Trackers", "Presupuestos")}
          </span>
          <span className="flex min-h-11 items-center text-base font-bold text-muted-foreground">
            {t("Savers", "Metas")}
          </span>
        </div>
        <BudgetSummaryFigure
          className="mt-6"
          amount={limit - spent}
          lead={t("Left in Trackers", "Queda en Presupuestos")}
          detail={t("18 days to go", "quedan 18 días")}
          meta={t(
            `${formatCurrency(spent, DEMO_CURRENCY, intlLocale)} of ${formatCurrency(limit, DEMO_CURRENCY, intlLocale)} spent`,
            `${formatCurrency(spent, DEMO_CURRENCY, intlLocale)} de ${formatCurrency(limit, DEMO_CURRENCY, intlLocale)} gastado`
          )}
        />
        <div className="mt-6">
          <TrackerWallet rows={demoTrackers.slice(0, 5)} daysRemaining={18} />
        </div>
      </div>
      <DemoTabBar activeKey="budget" />
    </Frame>
  );
}

export function WealthDemoScreen() {
  const { t, intlLocale } = useLocale();

  const buckets = [
    { key: "accounts", label: t("Accounts", "Cuentas") },
    { key: "savings", label: t("Savings", "Ahorros") },
    { key: "investments", label: t("Investments", "Inversiones") },
    { key: "lent", label: t("Money lent", "Dinero prestado") },
    { key: "debts", label: t("Debts", "Deudas") },
  ] as const;

  return (
    <Frame>
      <DemoChrome>
        <DemoStatusBar />
        <DemoRail activeKey="wealth" />
        <DemoHero
          amount={demoNetWorth}
          currency={DEMO_CURRENCY}
          label={t("Net worth", "Patrimonio neto")}
          tone="white"
          detail={`+${formatCurrency(demoNetWorthChange, DEMO_CURRENCY, intlLocale)} ${t("this month", "este mes")}`}
        />
      </DemoChrome>
      <DemoSheet>
        <p className="px-4.5 pt-4 pb-1.5 text-heading font-bold">
          {t("Organise your money", "Organiza tu dinero")}
        </p>
        {buckets.map((bucket) => {
          const row = demoWealthBuckets.find((item) => item.key === bucket.key);
          if (!row) return null;
          const negative = row.amount < 0;
          return (
            <div
              key={bucket.key}
              className="flex min-h-13 items-center gap-3 border-b border-border px-4.5 py-2.5"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: WEALTH_ACCENTS[bucket.key] }}
              />
              <p className="flex-1 text-body font-semibold">{bucket.label}</p>
              <p
                className={
                  negative
                    ? "text-body font-semibold text-danger tabular-nums"
                    : "text-body font-semibold tabular-nums"
                }
              >
                {formatCurrency(row.amount, DEMO_CURRENCY, intlLocale)}
              </p>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          );
        })}
        <p className="px-4.5 pt-4 pb-1.5 text-heading font-bold">
          {t("By currency", "Por moneda")}
        </p>
        {[
          { code: "EUR", amount: 35700, ratio: 0.74 },
          { code: "COP", amount: 12420, ratio: 0.26 },
        ].map((row, index) => (
          <div key={row.code} className="px-4.5 py-2">
            <div className="flex items-center justify-between text-body font-semibold">
              <span>{row.code}</span>
              <span className="tabular-nums">
                {formatCurrency(row.amount, DEMO_CURRENCY, intlLocale)}
              </span>
            </div>
            <div className="up-track mt-1.5 h-1.5 overflow-hidden rounded-full">
              <span
                className={
                  index === 0
                    ? "block h-full rounded-full bg-foreground"
                    : "block h-full rounded-full bg-coral"
                }
                style={{ width: `${row.ratio * 100}%` }}
              />
            </div>
          </div>
        ))}
      </DemoSheet>
      <DemoTabBar activeKey="wealth" />
    </Frame>
  );
}

export function InsightsDemoScreen() {
  const { t, intlLocale } = useLocale();

  return (
    <Frame>
      <DemoChrome>
        <DemoStatusBar />
        <DemoRail activeKey="insights" />
        <DemoHero
          amount={demoMoneyOut}
          currency={DEMO_CURRENCY}
          label={t("Spent in August", "Gastado en agosto")}
          tone="white"
          detail={t("€212 more than July", "212 € más que en julio")}
          detailTone="coral"
        />
      </DemoChrome>
      <DemoSheet>
        <div className="flex items-center justify-between border-b border-border px-4.5 py-3 text-body font-semibold">
          <span>{t("Last 12 months", "Últimos 12 meses")}</span>
          <span className="text-muted-foreground">{t("Daily", "Diario")}</span>
        </div>
        {/* Plain bars, not a chart library: a screenshot never needs to be
            interactive, and the real Insights chart animates on mount. The
            series colour is imported so it cannot drift from the app's. */}
        <div className="flex h-32 items-end gap-1.5 px-4.5 pt-4">
          {demoSpendMonths.map((month, index) => (
            <span
              key={`${month.key}-${index}`}
              className="flex-1 rounded-t-sm"
              style={{
                height: `${month.ratio * 100}%`,
                background: SPEND_CHART_COLOR,
                opacity: index === demoSpendMonths.length - 1 ? 1 : 0.72,
              }}
            />
          ))}
        </div>
        <div className="flex gap-1.5 border-b border-border px-4.5 pt-1.5 pb-3">
          {demoSpendMonths.map((month, index) => (
            <span
              key={`${month.key}-label-${index}`}
              className="flex-1 text-center text-label font-semibold text-muted-foreground"
            >
              {month.key}
            </span>
          ))}
        </div>
        <p className="px-4.5 pt-4 pb-1 text-heading font-bold">
          {t("Where it went", "En qué se fue")}
        </p>
        {demoSpendCategories.map((category) => (
          <div key={category.name} className="px-4.5 py-2">
            <div className="flex items-center justify-between text-body font-medium">
              <span>{category.name}</span>
              <span className="tabular-nums">
                {formatCurrency(category.amount, DEMO_CURRENCY, intlLocale)}
              </span>
            </div>
            <div className="up-track mt-1.5 h-1.5 overflow-hidden rounded-full">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${category.ratio * 100}%`,
                  background: category.color,
                }}
              />
            </div>
          </div>
        ))}
      </DemoSheet>
      <DemoTabBar activeKey="insights" />
    </Frame>
  );
}
