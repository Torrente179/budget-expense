"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CircleCheck,
  CircleUserRound,
  Loader2,
  Plus,
  Wallet,
} from "lucide-react";
import { HomeDashboardView } from "@/components/home/home-dashboard-view";
import { BudgetSaverCard, BudgetTrackerCard } from "@/components/budget/envelope-list-card";
import { MovementSummaryHero } from "@/components/movements/movement-summary-hero";
import { RecurringSummaryHero } from "@/components/movements/recurring-summary-hero";
import { RecurringSchedule } from "@/components/movements/recurring-schedule";
import { TransactionRow } from "@/components/patterns/transaction-row";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CaptureChrome,
  type CaptureKind,
} from "@/components/capture/capture-chrome";
import { CaptureFabButton } from "@/components/capture/capture-fab";
import { TabBar } from "@/components/layout/tab-bar";
import { Screen } from "@/components/patterns/screen";
import { MonthPicker } from "@/components/shared/month-picker";
import {
  ContinuousSheet,
  SheetSection,
} from "@/components/patterns/continuous-sheet";
import { SectionHeader } from "@/components/patterns/section-header";
import { MonthlyReport } from "@/components/insights/monthly-report";
import { OnboardingStoryShell } from "@/components/onboarding/onboarding-story-shell";
import { OrganizeMoneyGrid } from "@/components/wealth/organize-money-grid";
import { PatrimonioHero } from "@/components/wealth/patrimonio-hero";
import {
  WealthBreakdownList,
  type BreakdownRow,
} from "@/components/wealth/wealth-breakdown-list";
import {
  computeNetWorth,
  type WealthComponents,
} from "@/lib/wealth/net-worth";
import { StaticCurrencyProvider } from "@/providers/currency-provider";
import {
  StaticLocaleProvider,
  useLocale,
} from "@/providers/locale-provider";
import { QueryProvider } from "@/providers/query-provider";
import type { HomeDashboardViewProps } from "@/components/home/home-dashboard-view";
import type { EnvelopeRow } from "@/components/budget/envelope-list-card";
import type { RecurringScheduleItem } from "@/components/movements/recurring-schedule";

type ReviewState =
  | "populated"
  | "loading"
  | "empty"
  | "error"
  | "overspent"
  | "completed-goal"
  | "long-spanish"
  | "large-number"
  | "negative"
  | "multi-currency";

const states: ReviewState[] = [
  "populated",
  "loading",
  "empty",
  "error",
  "overspent",
  "completed-goal",
  "long-spanish",
  "large-number",
  "negative",
  "multi-currency",
];

const fixtureHome: HomeDashboardViewProps = {
  cashflow: {
    monthlyIncome: 4860,
    actualOutflows: 2418.56,
    remaining: 2441.44,
    usedRatio: 0.4976,
    monthProgress: 0.4516,
    daysRemaining: 17,
    dailyAvailable: 143.61,
    paceStatus: "slightly_ahead",
  },
  availableBalance: {
    amount: 3128.42,
    dailyAvailable: 184.02,
    source: "tracked",
  },
  monthEndLabel: "August 31",
  monthLabel: "August 2026",
  budgets: [
    { id: "groceries", name: "Groceries", limit: 560, spent: 436, ratio: 0.779, icon: "shopping-cart" },
    { id: "transport", name: "Transport", limit: 210, spent: 248, ratio: 1.181, icon: "car-front" },
    { id: "health", name: "Health & fitness", limit: 180, spent: 72, ratio: 0.4, icon: "heart-pulse" },
    { id: "streaming", name: "TV, music & streaming", limit: 75, spent: 44, ratio: 0.587, icon: "monitor-play" },
  ],
  spendingCategories: [
    { id: "housing", name: "Housing", value: 1080, color: "#FF7A64", expenseCount: 2 },
    { id: "groceries", name: "Groceries", value: 436, color: "#B565D8", expenseCount: 9 },
    { id: "transport", name: "Transportation", value: 248, color: "#28C4D8", expenseCount: 12 },
    { id: "giving", name: "Giving", value: 220, color: "#FFE14D", expenseCount: 1 },
    { id: "other", name: "Other", value: 434.56, color: "#8B8D98", expenseCount: 14 },
  ],
  spendingTotal: 2418.56,
  upcoming: [
    { id: "netflix", title: "Netflix", dueLabel: "tomorrow", amount: 17.99, currency: "EUR", category: { icon: "monitor-play", color: "#FF7A64" } },
    { id: "gym", title: "Basic-Fit", dueLabel: "August 18", amount: 29.99, currency: "EUR", category: { icon: "dumbbell", color: "#28C4D8" } },
  ],
  feedDays: [
    {
      date: "2026-08-14",
      label: "Fri, Aug 14",
      movements: [
        { id: "m1", kind: "expense", title: "Mercadona", subtitle: "Groceries · 18:42", amount: 54.72, currency: "EUR", category: { icon: "shopping-cart", color: "#B565D8" }, needsReview: false, alt: false },
        { id: "m2", kind: "income", title: "Upwork", subtitle: "Professional services · 12:16", amount: 1225, currency: "USD", category: { icon: "briefcase-business", color: "#3DDC97" }, needsReview: false, alt: true },
      ],
    },
    {
      date: "2026-08-13",
      label: "Thu, Aug 13",
      movements: [
        { id: "m3", kind: "expense", title: "Renfe", subtitle: "Transportation · 09:07", amount: 31.4, currency: "EUR", category: { icon: "train", color: "#28C4D8" }, needsReview: false, alt: false },
        { id: "m4", kind: "expense", title: "Unknown card payment", subtitle: "Needs review · 00:18", amount: 19.8, currency: "GBP", category: null, needsReview: true, alt: true },
      ],
    },
  ],
};

const trackers: EnvelopeRow[] = [
  { id: "t1", name: "Groceries", kind: "spending_limit", target: 560, progressAmount: 436, ratio: 0.779, icon: "shopping-cart", color: "#B565D8", categoryName: "Groceries" },
  { id: "t2", name: "Transport", kind: "spending_limit", target: 210, progressAmount: 248, ratio: 1.181, icon: "car-front", color: "#28C4D8", categoryName: "Transportation" },
];

const savers: EnvelopeRow[] = [
  { id: "s1", name: "Japan 2027", kind: "contribution_goal", target: 4500, progressAmount: 2120, ratio: 0.471, icon: "plane-takeoff", color: "#FF7A64", categoryName: "Travel" },
  { id: "s2", name: "Emergency cushion", kind: "contribution_goal", target: 3000, progressAmount: 3000, ratio: 1, icon: "shield-check", color: "#3DDC97", categoryName: "Savings" },
];

const recurring: RecurringScheduleItem[] = [
  { id: "r1", title: "Medium", categoryName: "Subscriptions", categoryIcon: "newspaper", categoryColor: "#1A1B23", amount: 6.97, currency: "USD", chargeDay: 16, isActive: true },
  { id: "r2", title: "Spotify", categoryName: "Music", categoryIcon: "music", categoryColor: "#3DDC97", amount: 17.99, currency: "EUR", chargeDay: 19, isActive: true },
  { id: "r3", title: "GitHub", categoryName: "Work", categoryIcon: "code-xml", categoryColor: "#8B8D98", amount: 9.65, currency: "USD", chargeDay: 25, isActive: false },
];

const fixtureWealth: WealthComponents = {
  accountsAndCash: 8_420,
  savings: 12_250,
  investments: 19_840,
  moneyLent: 1_200,
  debts: 6_380,
};

const fixtureInsightCategories = [
  {
    category_id: "housing",
    category_name: "Housing",
    category_color: "#FF7A64",
    category_icon: "house",
    total_amount: 1_080,
    expense_count: 2,
  },
  {
    category_id: "groceries",
    category_name: "Groceries",
    category_color: "#B565D8",
    category_icon: "shopping-cart",
    total_amount: 436,
    expense_count: 9,
  },
  {
    category_id: "transport",
    category_name: "Transportation",
    category_color: "#28C4D8",
    category_icon: "car-front",
    total_amount: 248,
    expense_count: 12,
  },
  {
    category_id: "giving",
    category_name: "Giving",
    category_color: "#FFE14D",
    category_icon: "heart-handshake",
    total_amount: 220,
    expense_count: 1,
  },
];

function buildWealthComponents(state: ReviewState): WealthComponents {
  if (state === "empty") {
    return {
      accountsAndCash: 0,
      savings: 0,
      investments: 0,
      moneyLent: 0,
      debts: 0,
    };
  }
  if (state === "negative") {
    return {
      accountsAndCash: 315,
      savings: 0,
      investments: 0,
      moneyLent: 0,
      debts: 1_599.57,
    };
  }
  if (state === "large-number") {
    return {
      accountsAndCash: 124_000_000,
      savings: 86_000_000,
      investments: 740_654_321.09,
      moneyLent: 37_000_000,
      debts: 142_000_000,
    };
  }
  return fixtureWealth;
}

function buildHomeFixture(state: ReviewState): HomeDashboardViewProps {
  if (state === "empty") {
    return {
      ...fixtureHome,
      budgets: [],
      spendingCategories: [],
      spendingTotal: 0,
      feedDays: [],
      upcoming: [],
    };
  }

  if (state === "long-spanish") {
    const budgetNames = [
      "Supermercado y productos esenciales del hogar",
      "Transporte público y desplazamientos",
      "Salud, deporte y bienestar",
      "Televisión, música y plataformas digitales",
    ];
    const categoryNames = [
      "Vivienda",
      "Supermercado",
      "Transporte",
      "Donaciones",
      "Otros gastos",
    ];

    return {
      ...fixtureHome,
      monthEndLabel: "31 de agosto",
      monthLabel: "agosto de 2026",
      budgets: fixtureHome.budgets.map((budget, index) => ({
        ...budget,
        name: budgetNames[index] ?? budget.name,
      })),
      spendingCategories: fixtureHome.spendingCategories.map(
        (category, index) => ({
          ...category,
          name: categoryNames[index] ?? category.name,
        })
      ),
      upcoming: fixtureHome.upcoming.map((payment, index) => ({
        ...payment,
        title:
          index === 0
            ? "Suscripción de entretenimiento familiar"
            : "Centro deportivo del barrio",
        dueLabel: index === 0 ? "mañana" : "18 de agosto",
      })),
      feedDays: fixtureHome.feedDays.map((day, dayIndex) => ({
        ...day,
        label: dayIndex === 0 ? "vie, 14 ago" : "jue, 13 ago",
        movements: day.movements.map((movement, index) =>
          dayIndex === 0 && index === 0
            ? {
                ...movement,
                title:
                  "Restaurante excepcionalmente largo de la estación central",
                subtitle: "Restaurantes y cafeterías · 18:42",
                amount: 9_876_543.21,
                currency: "COP",
              }
            : movement
        ),
      })),
    };
  }

  if (state === "large-number") {
    return {
      ...fixtureHome,
      cashflow: {
        ...fixtureHome.cashflow,
        monthlyIncome: 1_234_567_890,
        actualOutflows: 246_913_578.91,
        remaining: 987_654_311.09,
        usedRatio: 0.2,
        dailyAvailable: 58_097_312.42,
      },
      availableBalance: {
        ...fixtureHome.availableBalance,
        amount: 987_654_321.09,
        dailyAvailable: 58_097_312.42,
      },
      budgets: fixtureHome.budgets.map((budget, index) => {
        const limit = 9_876_543.21 + index * 1_234_567.89;
        const ratio = 0.52 + index * 0.1;
        return { ...budget, limit, spent: limit * ratio, ratio };
      }),
      spendingCategories: fixtureHome.spendingCategories.map(
        (category, index) => ({
          ...category,
          value: [55_000_000, 33_000_000, 20_000_000, 10_000_000, 5_456_789.01][index],
        })
      ),
      spendingTotal: 123_456_789.01,
      upcoming: fixtureHome.upcoming.map((payment, index) => ({
        ...payment,
        amount: index === 0 ? 1_234_567.89 : 987_654.32,
        currency: index === 0 ? "JPY" : "USD",
      })),
      feedDays: fixtureHome.feedDays.map((day, dayIndex) => ({
        ...day,
        movements: day.movements.map((movement, index) =>
          dayIndex === 0 && index === 0
            ? {
                ...movement,
                amount: 987_654_321.09,
                currency: "COP",
              }
            : movement
        ),
      })),
    };
  }

  if (state === "negative") {
    return {
      ...fixtureHome,
      availableBalance: {
        ...fixtureHome.availableBalance,
        amount: -1_284.57,
        dailyAvailable: 0,
      },
    };
  }

  if (state === "overspent") {
    return {
      ...fixtureHome,
      budgets: fixtureHome.budgets.map((budget) => ({
        ...budget,
        spent: budget.limit + 84,
        ratio: (budget.limit + 84) / budget.limit,
      })),
    };
  }

  if (state === "multi-currency") {
    const currencies = ["COP", "USD", "JPY", "GBP"];
    return {
      ...fixtureHome,
      upcoming: fixtureHome.upcoming.map((payment, index) => ({
        ...payment,
        currency: index === 0 ? "USD" : "JPY",
      })),
      feedDays: fixtureHome.feedDays.map((day, dayIndex) => ({
        ...day,
        movements: day.movements.map((movement, movementIndex) => ({
          ...movement,
          currency: currencies[dayIndex * 2 + movementIndex] ?? "EUR",
        })),
      })),
    };
  }

  return fixtureHome;
}

function HarnessContent({
  state,
  setState,
}: {
  state: ReviewState;
  setState: (state: ReviewState) => void;
}) {
  const { t } = useLocale();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [captureKind, setCaptureKind] = useState<CaptureKind>("expense");
  const [captureAmount, setCaptureAmount] = useState("54,72");
  const [captureCurrency, setCaptureCurrency] = useState("EUR");
  const [reviewMonth, setReviewMonth] = useState({ month: 8, year: 2026 });

  const home = buildHomeFixture(state);
  const wealthComponents = buildWealthComponents(state);
  const wealthTotals = computeNetWorth(wealthComponents);
  const wealthIsEmpty = wealthTotals.totalAssets === 0 && wealthTotals.debts === 0;
  const wealthCounts = wealthIsEmpty
    ? { accounts: 0, savings: 0, investments: 0, lent: 0, debts: 0 }
    : { accounts: 2, savings: 3, investments: 5, lent: 1, debts: 2 };
  const wealthCategoryTotals = {
    accounts: wealthTotals.accountsAndCash,
    savings: wealthTotals.savings,
    investments: wealthTotals.investments,
    lent: wealthTotals.moneyLent,
    debts: wealthTotals.debts,
  };
  const wealthRows: BreakdownRow[] = [
    {
      key: "accounts",
      category: "accounts",
      label: t("Accounts & cash", "Cuentas y efectivo"),
      detail: t("2 accounts", "2 cuentas"),
      value: wealthTotals.accountsAndCash,
    },
    {
      key: "savings",
      category: "savings",
      label: t("Savings", "Ahorros"),
      detail: t("3 funds", "3 fondos"),
      value: wealthTotals.savings,
    },
    {
      key: "investments",
      category: "investments",
      label: t("Investments", "Inversiones"),
      detail: t("5 positions", "5 posiciones"),
      value: wealthTotals.investments,
    },
    {
      key: "lent",
      category: "lent",
      label: t("Money lent", "Dinero prestado"),
      detail: t("1 loan", "1 préstamo"),
      value: wealthTotals.moneyLent,
    },
  ];
  const insightCategories =
    state === "empty"
      ? []
      : fixtureInsightCategories.map((category) =>
          state === "large-number"
            ? { ...category, total_amount: category.total_amount * 100_000 }
            : category
        );

  const fixtureTrackers = state === "overspent"
    ? trackers.map((row) => ({
        ...row,
        progressAmount: row.target + 84,
        ratio: 1.15,
      }))
    : trackers;
  const fixtureSavers = state === "completed-goal"
    ? savers.map((row) => ({
        ...row,
        progressAmount: row.target,
        ratio: 1,
      }))
    : savers;

  return (
    <main className="min-h-dvh bg-background pb-28">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink px-4 py-3 text-white">
        <div className="mx-auto grid max-w-[1480px] gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-3">
          <div className="min-w-0 flex-1">
            <p className="label-caps text-white/50">Private design review</p>
            <h1 className="text-heading font-semibold">UP-derived full-app review</h1>
          </div>
          <div
            className="flex w-full gap-1 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 lg:w-auto [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Fixture state"
          >
            {states.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setState(item)}
                className={`min-h-11 shrink-0 rounded-full px-3 text-caption font-medium capitalize transition-colors ${state === item ? "bg-coral text-ink" : "bg-white/[0.07] text-white/60 hover:text-white"}`}
              >
                {item.replaceAll("-", " ")}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] space-y-10 px-4 py-6 sm:px-5 lg:px-8">
        {state === "loading" ? (
          <section className="flex min-h-[60dvh] flex-col items-center justify-center bg-ink text-white md:rounded-xl">
            <Loader2 className="h-8 w-8 animate-spin text-coral" />
            <p className="mt-4 text-body text-white/55">Loading deterministic fixtures…</p>
          </section>
        ) : state === "error" ? (
          <section className="flex min-h-[60dvh] flex-col items-center justify-center bg-ink px-6 text-center text-white md:rounded-xl">
            <AlertTriangle className="h-8 w-8 text-coral" />
            <h2 className="mt-4 text-2xl font-semibold">The fixture did not load.</h2>
            <p className="mt-2 max-w-md text-sm text-white/55">This state never talks to Supabase. Financial data remains untouched.</p>
            <Button className="mt-5" onClick={() => setState("populated")}>Try populated state</Button>
          </section>
        ) : (
          <>
            <section>
              <p className="label-caps mb-3">
                Home · production shell + view components
              </p>
              <div className="overflow-hidden rounded-xl bg-background ring-1 ring-border">
                <div className="px-4 sm:px-5 lg:px-8">
                  <Screen
                    title={t("Home", "Inicio")}
                    mode="chrome-sheet"
                    width="wide"
                    leading={
                      <span
                        aria-hidden
                        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-white/60 md:hidden"
                      >
                        <CircleUserRound className="h-6 w-6" />
                      </span>
                    }
                    subheader={
                      <div className="flex justify-center sm:justify-end">
                        <MonthPicker
                          month={reviewMonth.month}
                          year={reviewMonth.year}
                          onChange={(month, year) =>
                            setReviewMonth({ month, year })
                          }
                          onInk
                          prefetchAdjacent={false}
                        />
                      </div>
                    }
                  >
                    <HomeDashboardView
                      {...home}
                      onSelectCategory={() => undefined}
                    />
                  </Screen>
                </div>
              </div>
            </section>

            <section className="min-w-0 rounded-xl bg-ink p-4 text-white sm:p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="label-caps text-white/50">Budget language</p>
                  <h2 className="mt-1 text-title font-semibold">Trackers + Savers</h2>
                </div>
                <Button size="sm"><Plus className="h-4 w-4" />New</Button>
              </div>
              <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-caption font-semibold text-white/55">Trackers</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(state === "empty" ? [] : fixtureTrackers).map((row) => <BudgetTrackerCard key={row.id} row={row} />)}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-caption font-semibold text-white/55">Savers / Metas</p>
                  <div className="grid gap-2.5">
                    {(state === "empty" ? [] : fixtureSavers).map((row) => <BudgetSaverCard key={row.id} row={row} />)}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
              <div className="min-w-0">
                <p className="label-caps mb-3">Movements</p>
                <MovementSummaryHero label="August net movement" netAmount={2441.44} incomeLabel="Money in" incomeAmount={4860} expenseLabel="Money out" expenseAmount={2418.56} currency="EUR" />
                <div className="up-content-sheet">
                  {home.feedDays.flatMap((day) => day.movements).map((movement) => (
                    <TransactionRow key={movement.id} {...movement} />
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <p className="label-caps mb-3">Recurring</p>
                <RecurringSummaryHero label="Recurring monthly charges" totalAmount={224.08} currency="EUR" cadenceLabel="Expected every month" activeCount={2} activeLabel="active" pausedCount={1} pausedLabel="paused" />
                <RecurringSchedule items={state === "empty" ? [] : recurring} title="August schedule" rangeLabel="16–25 Aug" dayLabel="Day" activeLabel="Active" pausedLabel="Paused" onEdit={() => undefined} />
              </div>
            </section>

            <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-border">
                <CaptureChrome
                  title={t("Add movement", "Añadir movimiento")}
                  titleElement="heading"
                  kind={captureKind}
                  amount={captureAmount}
                  currency={captureCurrency}
                  onKindChange={setCaptureKind}
                  onAmountChange={setCaptureAmount}
                  onCurrencyChange={setCaptureCurrency}
                />
                <div className="space-y-4 bg-white p-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="fixture-description">
                      {t("Description", "Descripción")}
                    </Label>
                    <Input
                      id="fixture-description"
                      key={state}
                      defaultValue={state === "long-spanish" ? "Restaurante excepcionalmente largo de la estación central" : "Mercadona"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fixture-category">
                      {t("Category", "Categoría")}
                    </Label>
                    <button
                      id="fixture-category"
                      type="button"
                      className="flex min-h-11 w-full items-center rounded-lg border border-border px-3 text-left text-sm"
                    >
                      {t("Groceries", "Supermercado")}
                    </button>
                  </div>
                  <Button className="w-full">
                    {captureKind === "expense"
                      ? t("Add expense", "Añadir gasto")
                      : t("Add income", "Añadir ingreso")}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col justify-center rounded-xl bg-ink px-6 py-8 text-white">
                <p className="label-caps text-white/50">Capture anatomy</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Amount first. Context immediately after.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-white/55">
                  This is the same production capture chrome, backed here by
                  local component state only. The live controller still owns
                  validation, category suggestions, loans, optimistic writes,
                  failure retention, undo, and save-and-add-another.
                </p>
              </div>
            </section>

            <section data-testid="wealth-report-preview">
              <p className="label-caps mb-3">
                Wealth + Insights · production view components
              </p>
              <div className="overflow-hidden rounded-xl bg-ink ring-1 ring-border">
                <PatrimonioHero
                  totals={wealthTotals}
                  monthlyChange={{
                    amount:
                      state === "negative"
                        ? -412
                        : state === "large-number"
                          ? 28_400_000
                          : wealthIsEmpty
                            ? null
                            : 842,
                    percentage:
                      state === "negative"
                        ? -0.24
                        : wealthIsEmpty
                          ? null
                          : 0.024,
                  }}
                  isEmpty={wealthIsEmpty}
                  addHref="/wealth/accounts"
                  className="mx-0 rounded-none sm:mx-0 md:mx-0 md:rounded-none"
                />
                <ContinuousSheet className="mx-0 rounded-none ring-0 sm:mx-0 md:mx-0 md:rounded-none md:ring-0">
                  <div className="grid lg:grid-cols-[minmax(0,.78fr)_minmax(0,1.22fr)] lg:divide-x lg:divide-border/70">
                    <div>
                      <OrganizeMoneyGrid
                        totals={wealthCategoryTotals}
                        counts={wealthCounts}
                        isEmpty={wealthIsEmpty}
                      />
                    </div>
                    <WealthBreakdownList
                      eyebrow={t("Owned", "Lo que tienes")}
                      title={t("Assets", "Activos")}
                      rows={wealthRows}
                      total={wealthTotals.totalAssets}
                      totalLabel={t("Total assets", "Total activos")}
                      emptyIcon={Wallet}
                      emptyTitle={t("No assets yet", "Aún no tienes activos")}
                      emptyDescription={t(
                        "Add an account, a savings fund or an investment to get started.",
                        "Añade una cuenta, un fondo de ahorro o una inversión para empezar."
                      )}
                    />
                  </div>
                  <SheetSection
                    header={
                      <SectionHeader
                        eyebrow={t("Report", "Reporte")}
                        title={t("Monthly insights", "Análisis mensual")}
                      />
                    }
                  >
                    {insightCategories.length > 0 ? (
                      <MonthlyReport
                        totalSpent={insightCategories.reduce(
                          (sum, category) => sum + category.total_amount,
                          0
                        )}
                        totalIncome={
                          state === "large-number" ? 486_000_000 : 4_860
                        }
                        previousMonthTotal={
                          state === "large-number" ? 174_000_000 : 2_170
                        }
                        categoryBreakdown={insightCategories}
                        overBudgetCount={state === "overspent" ? 2 : 0}
                        variant="section"
                      />
                    ) : (
                      <p className="py-6 text-center text-caption text-muted-foreground">
                        {t(
                          "Insights appear after the first movement.",
                          "El análisis aparecerá después del primer movimiento."
                        )}
                      </p>
                    )}
                  </SheetSection>
                </ContinuousSheet>
              </div>
            </section>

            <section data-testid="onboarding-preview">
              <p className="label-caps mb-3">Onboarding · production story shell</p>
              <div className="overflow-hidden rounded-xl ring-1 ring-border">
                <OnboardingStoryShell
                  stepIndex={1}
                  stepCount={6}
                  progressLabel={t(
                    "Setup preview progress",
                    "Progreso de la vista previa"
                  )}
                  eyebrow={t("Easy setup", "Configuración fácil")}
                  title={t(
                    "Start with what comes in.",
                    "Empieza por lo que entra."
                  )}
                  description={t(
                    "Your usual take-home amount anchors every tracker and daily guide.",
                    "Tu ingreso neto habitual da sentido a cada presupuesto y guía diaria."
                  )}
                  className="mx-0 mt-0 sm:mx-0 lg:mx-0"
                >
                  <div className="space-y-4">
                    <h2 className="text-heading font-semibold">
                      {t("Monthly income", "Ingreso mensual")}
                    </h2>
                    <p className="text-caption text-muted-foreground">
                      {t(
                        "What you usually take home this month.",
                        "Lo que sueles cobrar neto este mes."
                      )}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        aria-label={t("Monthly income", "Ingreso mensual")}
                        value={state === "large-number" ? "987654321,09" : "4860,00"}
                        readOnly
                        className="h-12 flex-1 font-mono text-xl"
                      />
                      <button
                        type="button"
                        className="min-h-12 rounded-lg border border-border px-4 font-mono text-sm"
                      >
                        EUR
                      </button>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="ghost">{t("Back", "Atrás")}</Button>
                      <Button className="flex-1">
                        {t("Continue", "Continuar")}
                      </Button>
                    </div>
                  </div>
                </OnboardingStoryShell>
              </div>
            </section>

            <section className="rounded-xl bg-white p-5 ring-1 ring-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="label-caps">Context preservation</p>
                  <h2 className="mt-1 text-heading font-semibold">Opaque contextual sheet</h2>
                </div>
                <Button onClick={() => setSheetOpen(true)}>Open transaction</Button>
              </div>
            </section>
          </>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="gap-0 overflow-hidden p-0 sm:left-1/2 sm:max-w-2xl sm:-translate-x-1/2">
          <div className="bg-ink px-4 pb-3 pt-2 text-white">
            <p className="label-caps text-white/50">Pinned context</p>
            <TransactionRow
              {...(home.feedDays[0]?.movements[0] ??
                fixtureHome.feedDays[0].movements[0])}
              className="-mx-4 mt-2 w-[calc(100%+2rem)] text-white [&_p]:text-white [&_span]:text-white"
            />
          </div>
          <SheetHeader>
            <SheetTitle>Mercadona</SheetTitle>
            <p className="text-sm text-muted-foreground">Review the category, add a note, or edit this movement without losing context.</p>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 px-4 pb-5">
            <button className="min-h-14 rounded-xl bg-secondary text-sm font-medium">Groceries</button>
            <button className="min-h-14 rounded-xl bg-secondary text-sm font-medium">Add note</button>
          </div>
          <div className="border-t border-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button className="w-full" onClick={() => setSheetOpen(false)}>
              <CircleCheck className="h-4 w-4" />
              {t("Done", "Listo")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <TabBar pathnameOverride="/home" staticPreview />
      <CaptureFabButton onClick={() => setSheetOpen(true)} />
    </main>
  );
}

export function UpReviewHarness() {
  const [state, setState] = useState<ReviewState>("populated");

  return (
    <QueryProvider>
      <StaticLocaleProvider locale={state === "long-spanish" ? "es" : "en"}>
        <StaticCurrencyProvider>
          <HarnessContent state={state} setState={setState} />
        </StaticCurrencyProvider>
      </StaticLocaleProvider>
    </QueryProvider>
  );
}
