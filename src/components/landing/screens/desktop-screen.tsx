"use client";

import { HomeActivitySheet } from "@/components/home/home-activity-sheet";
import { HomeBalanceCard } from "@/components/home/home-balance-card";
import { TrackerPills } from "@/components/home/tracker-pills";
import { MENU_NAV, PRIMARY_NAV } from "@/lib/navigation";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import {
  DEMO_CURRENCY,
  demoBalance,
  demoCashflow,
  demoFeedDays,
  demoSpendCategories,
  demoTrackers,
  demoUpcoming,
} from "@/components/landing/demo-data";

/**
 * The same app at desktop width: sidebar, header, and the month in two
 * columns. It exists on the landing page to answer "is this a real
 * application" before the phone sections start.
 *
 * Nav rows come from `lib/navigation.ts` like every other nav surface, and
 * the left column is built from Home's production components, so the
 * screenshot cannot show something the app does not have.
 */
export function DesktopDemoScreen() {
  const { t, locale, intlLocale } = useLocale();

  return (
    <div className="flex h-[764px]">
      <aside className="up-chrome w-59 shrink-0 px-3.5 py-5">
        <div className="flex items-center gap-2.5 px-2 pb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/budget-expense-app-icon.png"
            alt=""
            className="h-6.5 w-6.5 rounded-md"
          />
          <span className="text-body font-bold">Budget &amp; Expense</span>
        </div>
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.key === "home";
          return (
            <span
              key={item.key}
              className={
                active
                  ? "flex items-center gap-3 rounded-lg bg-white/10 px-2.5 py-2 text-body font-semibold text-white"
                  : "flex items-center gap-3 rounded-lg px-2.5 py-2 text-body font-medium text-white/55"
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.6} />
              {item.label[locale]}
            </span>
          );
        })}
        <p className="label-caps px-2.5 pt-5 pb-1.5 text-white/32">
          {t("More", "Más")}
        </p>
        {MENU_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <span
              key={item.key}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-body font-medium text-white/55"
            >
              <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.6} />
              {item.label[locale]}
            </span>
          );
        })}
      </aside>

      <div className="flex-1 overflow-hidden bg-background">
        <header className="flex h-16 items-center gap-2.5 px-6.5">
          <span className="text-heading font-bold">
            {t("August", "Agosto")}
          </span>
          <span className="flex-1" />
          {[t("Search ⌘K", "Buscar ⌘K"), "EN", "EUR"].map((pill) => (
            <span
              key={pill}
              className="flex h-11 items-center rounded-full border border-border bg-card px-3.5 text-caption font-semibold text-muted-foreground"
            >
              {pill}
            </span>
          ))}
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-coral text-xl font-bold text-on-coral">
            +
          </span>
        </header>

        <div className="grid grid-cols-[1.5fr_1fr] gap-6 px-6.5 py-3">
          <div className="min-w-0">
            <HomeBalanceCard
              cashflow={demoCashflow}
              availableBalance={demoBalance}
              className="max-w-md"
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
              className="mt-5"
            />
            <div className="mt-6 overflow-hidden rounded-2xl bg-card px-1 py-5 ring-1 ring-border">
              <HomeActivitySheet
                feedDays={demoFeedDays.slice(0, 2)}
                upcoming={demoUpcoming}
              />
            </div>
          </div>

          <div>
            <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
              <p className="px-4.5 pt-3.5 pb-2 text-body font-bold">
                {t("Where it went", "En qué se fue")}
              </p>
              {demoSpendCategories.map((category) => (
                <div key={category.name} className="px-4.5 py-2">
                  <div className="flex items-center justify-between text-caption font-medium">
                    <span>{category.name}</span>
                    <span className="tabular-nums">
                      {formatCurrency(
                        category.amount,
                        DEMO_CURRENCY,
                        intlLocale
                      )}
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
              <div className="h-2.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
