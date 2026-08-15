"use client";

import { ChevronRight } from "lucide-react";
import { SPEND_CHART_COLOR } from "@/components/charts/chart-theme";
import { BudgetTrackerCard } from "@/components/budget/envelope-list-card";
import { HomeActivitySheet } from "@/components/home/home-activity-sheet";
import { WEALTH_ACCENTS } from "@/lib/palette";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import {
  DEMO_CURRENCY,
  demoAvailable,
  demoBudgetRemaining,
  demoFeedDays,
  demoMoneyIn,
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
  DemoFab,
  DemoHero,
  DemoRail,
  DemoSheet,
  DemoStatusBar,
} from "@/components/landing/screens/screen-chrome";

/**
 * The four screens shown on the public page.
 *
 * Wherever the app has a component that is free of viewport breakpoints, the
 * screen renders that component rather than a copy of it — `HomeActivitySheet`
 * for the feed, `BudgetTrackerCard` for the trackers. When those change, the
 * landing page changes with them, which is the whole point: a marketing
 * screenshot that can go stale is a marketing screenshot that will.
 */

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-0 flex flex-col">{children}</div>;
}

export function HomeDemoScreen() {
  const { t } = useLocale();

  return (
    <Frame>
      <DemoChrome>
        <DemoStatusBar />
        <DemoRail activeKey="home" />
        <DemoHero
          amount={demoAvailable}
          currency={DEMO_CURRENCY}
          label={t("Available", "Disponible")}
        />
      </DemoChrome>
      <HomeActivitySheet
        monthLabel={t("August 2026", "Agosto 2026")}
        feedDays={demoFeedDays}
        upcoming={demoUpcoming}
        className="flex-1"
      />
      <DemoFab />
    </Frame>
  );
}

export function BudgetDemoScreen() {
  const { t, intlLocale } = useLocale();

  return (
    <Frame>
      <DemoChrome>
        <DemoStatusBar />
        <DemoRail activeKey="budget" />
        <DemoHero
          amount={demoBudgetRemaining}
          currency={DEMO_CURRENCY}
          label={t("Left to spend this month", "Queda por gastar este mes")}
        />
        <div className="mt-3 flex gap-5 px-4.5">
          <span className="text-body font-bold text-white">
            {t("Trackers", "Presupuestos")}
          </span>
          <span className="text-body font-semibold text-white/50">
            {t("Savers", "Metas")}
          </span>
        </div>
      </DemoChrome>
      {/* Budget has no white sheet — cards float on the chrome colour. */}
      <div className="up-canvas flex-1">
        <div className="grid grid-cols-2 border-b border-white/10">
          <div className="px-4.5 py-3">
            <p className="text-title font-bold tabular-nums">
              {formatCurrency(demoMoneyOut, DEMO_CURRENCY, intlLocale)}
            </p>
            <p className="text-caption text-white/50">
              {t("Money out", "Dinero que sale")}
            </p>
          </div>
          <div className="border-l border-white/10 px-4.5 py-3">
            <p className="text-title font-bold text-income tabular-nums">
              +{formatCurrency(demoMoneyIn, DEMO_CURRENCY, intlLocale)}
            </p>
            <p className="text-caption text-white/50">
              {t("Money in", "Dinero que entra")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-4">
          {demoTrackers.map((row) => (
            <BudgetTrackerCard key={row.id} row={row} />
          ))}
        </div>
      </div>
      <DemoFab />
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
                    ? "block h-full rounded-full bg-ink"
                    : "block h-full rounded-full bg-coral"
                }
                style={{ width: `${row.ratio * 100}%` }}
              />
            </div>
          </div>
        ))}
      </DemoSheet>
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
    </Frame>
  );
}
