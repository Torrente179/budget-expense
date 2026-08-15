"use client";

import { useState } from "react";
import { AlertTriangle, CircleCheck, Loader2, Plus } from "lucide-react";
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
import { StaticCurrencyProvider } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
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

function HarnessContent() {
  const { t } = useLocale();
  const [state, setState] = useState<ReviewState>("populated");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [captureKind, setCaptureKind] = useState<CaptureKind>("expense");
  const [captureAmount, setCaptureAmount] = useState("54,72");
  const [captureCurrency, setCaptureCurrency] = useState("EUR");

  const home = state === "empty"
    ? { ...fixtureHome, budgets: [], spendingCategories: [], spendingTotal: 0, feedDays: [], upcoming: [] }
    : state === "long-spanish"
      ? {
          ...fixtureHome,
          monthLabel: "Agosto de dos mil veintiséis",
          feedDays: fixtureHome.feedDays.map((day) => ({
            ...day,
            movements: day.movements.map((movement, index) => index === 0
              ? { ...movement, title: "Restaurante excepcionalmente largo de la estación central", amount: 9876543.21, currency: "COP" }
              : movement),
          })),
        }
      : state === "large-number"
        ? {
            ...fixtureHome,
            availableBalance: {
              ...fixtureHome.availableBalance,
              amount: 987654321.09,
            },
          }
        : state === "negative"
          ? {
              ...fixtureHome,
              availableBalance: {
                ...fixtureHome.availableBalance,
                amount: -1284.57,
              },
            }
          : state === "overspent"
            ? {
                ...fixtureHome,
                budgets: fixtureHome.budgets.map((budget) => ({
                  ...budget,
                  spent: budget.limit + 84,
                  ratio: 1.15,
                })),
              }
      : fixtureHome;

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
    <main className="min-h-dvh bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink px-4 py-3 text-white">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="label-caps text-white/42">Private design review</p>
            <h1 className="text-heading font-semibold">UP-derived approval checkpoint</h1>
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Fixture state">
            {states.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setState(item)}
                className={`min-h-11 rounded-full px-3 text-caption font-medium capitalize transition-colors ${state === item ? "bg-coral text-white" : "bg-white/[0.07] text-white/60 hover:text-white"}`}
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
              <p className="label-caps mb-3">Home · production view component</p>
              <HomeDashboardView {...home} />
            </section>

            <section className="rounded-xl bg-ink p-4 text-white sm:p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="label-caps text-white/42">Budget language</p>
                  <h2 className="mt-1 text-title font-semibold">Trackers + Savers</h2>
                </div>
                <Button size="sm"><Plus className="h-4 w-4" />New</Button>
              </div>
              <div className="mt-4 grid gap-5 lg:grid-cols-2">
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

            <section className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="label-caps mb-3">Movements</p>
                <MovementSummaryHero label="August net movement" netAmount={2441.44} incomeLabel="Money in" incomeAmount={4860} expenseLabel="Money out" expenseAmount={2418.56} currency="EUR" />
                <div className="up-content-sheet">
                  {fixtureHome.feedDays.flatMap((day) => day.movements).map((movement) => (
                    <TransactionRow key={movement.id} {...movement} />
                  ))}
                </div>
              </div>
              <div>
                <p className="label-caps mb-3">Recurring</p>
                <RecurringSummaryHero label="Recurring monthly charges" totalAmount={224.08} currency="EUR" cadenceLabel="Expected every month" activeCount={2} activeLabel="active" pausedCount={1} pausedLabel="paused" />
                <RecurringSchedule items={state === "empty" ? [] : recurring} title="August schedule" rangeLabel="16–25 Aug" dayLabel="Day" activeLabel="Active" pausedLabel="Paused" onEdit={() => undefined} />
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
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
                <p className="label-caps text-white/42">Capture anatomy</p>
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
            <p className="label-caps text-white/42">Pinned context</p>
            <TransactionRow {...fixtureHome.feedDays[0].movements[0]} className="-mx-4 mt-2 w-[calc(100%+2rem)] text-white [&_p]:text-white [&_span]:text-white" />
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
    </main>
  );
}

export function UpReviewHarness() {
  return (
    <StaticCurrencyProvider>
      <HarnessContent />
    </StaticCurrencyProvider>
  );
}
