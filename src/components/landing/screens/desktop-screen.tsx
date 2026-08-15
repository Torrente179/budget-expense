"use client";

import { BudgetTrackerCard } from "@/components/budget/envelope-list-card";
import { TransactionRow } from "@/components/patterns/transaction-row";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/navigation";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import {
  DEMO_CURRENCY,
  demoAvailable,
  demoDailyGuide,
  demoFeedDays,
  demoMoneyIn,
  demoMoneyOut,
  demoSpendCategories,
  demoTrackers,
} from "@/components/landing/demo-data";

/**
 * The same app at desktop width: ink sidebar, solid header, and the month in
 * two columns. It exists on the landing page to answer "is this a real
 * application" before the phone sections start.
 *
 * Nav rows come from `lib/navigation.ts` like every other nav surface, so the
 * screenshot cannot show a section the app does not have.
 */
export function DesktopDemoScreen() {
  const { t, locale, intlLocale } = useLocale();
  const stats = [
    {
      label: t("Money in", "Dinero que entra"),
      value: `+${formatCurrency(demoMoneyIn, DEMO_CURRENCY, intlLocale)}`,
      income: true,
    },
    {
      label: t("Money out", "Dinero que sale"),
      value: formatCurrency(demoMoneyOut, DEMO_CURRENCY, intlLocale),
      income: false,
    },
    {
      label: t("Daily guide", "Guía diaria"),
      value: formatCurrency(demoDailyGuide, DEMO_CURRENCY, intlLocale),
      income: false,
    },
    {
      label: t("Left in month", "Quedan en el mes"),
      value: t("6 days", "6 días"),
      income: false,
    },
  ];

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
        {SECONDARY_NAV.map((item) => {
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
        <header className="flex h-15 items-center gap-3.5 border-b border-border bg-card px-6.5">
          <span className="text-title font-bold">{t("Home", "Inicio")}</span>
          <span className="flex-1" />
          {[
            t("August 2026", "Agosto 2026"),
            "EUR",
            t("Search ⌘K", "Buscar ⌘K"),
          ].map((pill) => (
            <span
              key={pill}
              className="flex h-8.5 items-center rounded-full border border-border px-3.5 text-caption font-semibold text-muted-foreground"
            >
              {pill}
            </span>
          ))}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-caption font-bold text-white">
            JP
          </span>
        </header>

        <div className="grid grid-cols-[1.5fr_1fr] gap-4.5 px-6.5 py-5">
          <div>
            <div className="up-chrome rounded-xl px-6.5 py-6">
              <p className="up-figure text-display font-bold tabular-nums">
                {formatCurrency(demoAvailable, DEMO_CURRENCY, intlLocale)}
              </p>
              <p className="mt-0.5 text-caption text-white/55">
                {t(
                  "Available · tracked to 13 August",
                  "Disponible · al 13 de agosto"
                )}
              </p>
              <div className="mt-5 flex gap-6.5 border-t border-white/10 pt-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p
                      className={
                        stat.income
                          ? "text-heading font-bold text-income tabular-nums"
                          : "text-heading font-bold tabular-nums"
                      }
                    >
                      {stat.value}
                    </p>
                    <p className="text-label text-white/55">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4.5 overflow-hidden rounded-xl bg-card ring-1 ring-border">
              <div className="flex items-center px-4.5 pt-3.5 pb-2.5">
                <span className="text-body font-bold">
                  {t("Recent movements", "Movimientos recientes")}
                </span>
                <span className="ml-auto text-caption font-semibold text-primary">
                  {t("See all", "Ver todo")}
                </span>
              </div>
              {demoFeedDays.slice(0, 2).map((day) => (
                <div key={day.date}>
                  <p className="up-stripe label-caps px-4.5 py-1.5">
                    {day.label}
                  </p>
                  {day.movements.map((movement) => (
                    <TransactionRow
                      key={movement.id}
                      title={movement.title}
                      subtitle={movement.subtitle}
                      amount={movement.amount}
                      currency={movement.currency}
                      kind={movement.kind}
                      category={movement.category}
                      needsReview={movement.needsReview}
                      alt={movement.alt}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
              <div className="flex items-center px-4.5 pt-3.5 pb-2.5">
                <span className="text-body font-bold">
                  {t("Trackers", "Presupuestos")}
                </span>
                <span className="ml-auto text-caption font-semibold text-primary">
                  {t("Manage", "Gestionar")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 px-3.5 pb-3.5">
                {demoTrackers.slice(0, 4).map((row) => (
                  <BudgetTrackerCard key={row.id} row={row} />
                ))}
              </div>
            </div>

            <div className="mt-4.5 overflow-hidden rounded-xl bg-card ring-1 ring-border">
              <p className="px-4.5 pt-3.5 pb-2 text-body font-bold">
                {t("Where it went", "En qué se fue")}
              </p>
              {demoSpendCategories.slice(0, 3).map((category) => (
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
