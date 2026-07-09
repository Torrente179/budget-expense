"use client";

import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomes } from "@/hooks/use-incomes";
import { useRecurringExpenses } from "@/hooks/use-recurring-expenses";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import {
  getCurrentMonth,
  getCurrentYear,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { CategoryIcon } from "@/components/shared/category-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Repeat,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  return new Date(year, month - 1, 1).getDay();
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Compact currency for tiny calendar cells — no decimals, compact notation for large values */
function compactAmount(amount: number, currency: string, locale?: string) {
  const intlLocale = locale === "es" ? "es-ES" : "en-US";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: Math.abs(amount) >= 10000 ? "compact" : "standard",
  }).format(amount);
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DayData {
  incomes: { id: string; source: string; amount: number; currency: string; description: string | null }[];
  expenses: { id: string; description: string | null; amount: number; currency: string; categoryName: string; categoryIcon: string; categoryColor: string }[];
  recurringBills: { id: string; description: string | null; amount: number; currency: string; categoryName: string; categoryIcon: string; categoryColor: string }[];
}

interface CalendarEntry {
  id: string;
  type: "income" | "expense" | "recurring";
  label: string;
  amount: number;
  currency: string;
}

const MAX_CELL_ITEMS = 3;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CalendarPage() {
  const { locale, t } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { expenses, loading: loadingExpenses } = useExpenses({ month, year });
  const { incomes, loading: loadingIncomes } = useIncomes({ month, year });
  const { recurringExpenses } = useRecurringExpenses();

  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
  const todayDay = today.getDate();
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);

  /* Build day map */
  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>();

    function ensure(key: string): DayData {
      if (!map.has(key)) map.set(key, { incomes: [], expenses: [], recurringBills: [] });
      return map.get(key)!;
    }

    for (const inc of incomes) {
      const d = ensure(inc.date);
      d.incomes.push({
        id: inc.id,
        source: inc.source,
        amount: inc.amount,
        currency: inc.currency,
        description: inc.description,
      });
    }

    for (const exp of expenses) {
      const cat = (exp as any).categories;
      const d = ensure(exp.date);
      d.expenses.push({
        id: exp.id,
        description: exp.description,
        amount: exp.amount,
        currency: exp.currency,
        categoryName: cat?.name ?? "Other",
        categoryIcon: cat?.icon ?? "more-horizontal",
        categoryColor: cat?.color ?? "#64748b",
      });
    }

    for (const rec of (recurringExpenses ?? [])) {
      if (!rec.is_active) continue;
      const chargeDay = Math.min(rec.charge_day, daysInMonth);
      const key = dateKey(year, month, chargeDay);
      const d = ensure(key);
      const cat = (rec as any).categories;
      const alreadyCharged = d.expenses.some((e) => (e as any).recurring_expense_id === rec.id);
      if (!alreadyCharged) {
        d.recurringBills.push({
          id: rec.id,
          description: rec.description,
          amount: rec.amount,
          currency: rec.currency,
          categoryName: cat?.name ?? "Other",
          categoryIcon: cat?.icon ?? "more-horizontal",
          categoryColor: cat?.color ?? "#64748b",
        });
      }
    }

    return map;
  }, [incomes, expenses, recurringExpenses, month, year, daysInMonth]);

  /* Daily totals for compact cell display */
  const dayTotals = useMemo(() => {
    const totals = new Map<number, { income: number; expense: number }>();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = dateKey(year, month, d);
      const data = dayMap.get(key);
      if (!data) continue;
      let income = 0;
      let expense = 0;
      for (const inc of data.incomes) income += convert(inc.amount, inc.currency);
      for (const exp of data.expenses) expense += convert(exp.amount, exp.currency);
      for (const bill of data.recurringBills) expense += convert(bill.amount, bill.currency);
      totals.set(d, { income, expense });
    }
    return totals;
  }, [dayMap, daysInMonth, convert, year, month]);

  /* Summary stats */
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let upcomingBills = 0;
    let upcomingBillCount = 0;

    for (const inc of incomes) {
      totalIncome += convert(inc.amount, inc.currency);
    }
    for (const exp of expenses) {
      totalExpense += convert(exp.amount, exp.currency);
    }
    for (const rec of (recurringExpenses ?? [])) {
      if (!rec.is_active) continue;
      const chargeDay = Math.min(rec.charge_day, daysInMonth);
      if (!isCurrentMonth || chargeDay > todayDay) {
        upcomingBills += convert(rec.amount, rec.currency);
        upcomingBillCount++;
      }
    }

    return {
      totalIncome,
      totalExpense,
      netCashFlow: totalIncome - totalExpense,
      upcomingBills,
      upcomingBillCount,
    };
  }, [incomes, expenses, recurringExpenses, convert, daysInMonth, isCurrentMonth, todayDay]);

  /* Selected day data */
  const selectedDayData = useMemo(() => {
    if (selectedDay === null) return null;
    const key = dateKey(year, month, selectedDay);
    return dayMap.get(key) ?? null;
  }, [selectedDay, dayMap, month, year]);

  /* Week day headers */
  const weekDays = useMemo(
    () =>
      locale === "es"
        ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    [locale]
  );

  /* Build calendar cells */
  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [firstDay, daysInMonth]);

  /* Merge items for cell preview */
  function getDayEntries(data: DayData | undefined): CalendarEntry[] {
    if (!data) return [];
    return [
      ...data.incomes.map((inc) => ({
        id: inc.id,
        type: "income" as const,
        label: inc.source,
        amount: inc.amount,
        currency: inc.currency,
      })),
      ...data.expenses.map((exp) => ({
        id: exp.id,
        type: "expense" as const,
        label: exp.description ?? exp.categoryName,
        amount: exp.amount,
        currency: exp.currency,
      })),
      ...data.recurringBills.map((bill) => ({
        id: bill.id,
        type: "recurring" as const,
        label: bill.description ?? bill.categoryName,
        amount: bill.amount,
        currency: bill.currency,
      })),
    ];
  }

  /* Shared selected-day detail panel */
  function renderDayDetail() {
    if (selectedDay === null) return null;

    const selectedTotal = dayTotals.get(selectedDay);

    return (
      <motion.div
        key={selectedDay}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="border-border/80 bg-card/96">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">
                  {formatDate(dateKey(year, month, selectedDay), "EEEE, MMMM d")}
                </CardTitle>
              </div>
              {selectedTotal && (
                <span
                  className={`font-mono text-sm font-semibold ${
                    selectedTotal.income >= selectedTotal.expense
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {selectedTotal.income - selectedTotal.expense >= 0 ? "+" : ""}
                  {formatCurrency(selectedTotal.income - selectedTotal.expense, baseCurrency)}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {!selectedDayData ||
            (selectedDayData.incomes.length === 0 &&
              selectedDayData.expenses.length === 0 &&
              selectedDayData.recurringBills.length === 0) ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("No transactions on this day", "Sin transacciones este día")}
              </p>
            ) : (
              <>
                {selectedDayData.incomes.map((inc) => (
                  <div
                    key={inc.id}
                    className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {inc.source}
                      </p>
                      {inc.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {inc.description}
                        </p>
                      )}
                    </div>
                    <span className="ml-3 shrink-0 font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(inc.amount, inc.currency)}
                    </span>
                  </div>
                ))}

                {selectedDayData.expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/40 px-3 py-2.5"
                  >
                    <CategoryIcon
                      icon={exp.categoryIcon}
                      color={exp.categoryColor}
                      className="h-7 w-7 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {exp.description ?? exp.categoryName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exp.categoryName}
                      </p>
                    </div>
                    <span className="ml-2 shrink-0 font-mono text-sm font-medium text-red-600 dark:text-red-400">
                      -{formatCurrency(exp.amount, exp.currency)}
                    </span>
                  </div>
                ))}

                {selectedDayData.recurringBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/8 px-3 py-2.5"
                  >
                    <CategoryIcon
                      icon={bill.categoryIcon}
                      color={bill.categoryColor}
                      className="h-7 w-7 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {bill.description ?? bill.categoryName}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <Repeat className="h-3 w-3" />
                        {t("Recurring", "Recurrente")}
                      </p>
                    </div>
                    <span className="ml-2 shrink-0 font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(bill.amount, bill.currency)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t("Calendar", "Calendario")}
        description={t(
          "Visualize your cash flow — paydays, bills, and expenses — on a monthly calendar.",
          "Visualiza tu flujo de efectivo — días de pago, facturas y gastos — en un calendario mensual."
        )}
      >
        <MonthPicker
          month={month}
          year={year}
          onChange={(m, y) => {
            setMonth(m);
            setYear(y);
            setSelectedDay(null);
          }}
        />
      </PageHeader>

      {/* ── Mobile / tablet summary strip (below xl) ── */}
      <div className="grid grid-cols-3 gap-2 xl:hidden">
        <div className="flex flex-col rounded-2xl border border-border/70 bg-card/96 px-3 py-2.5">
          <span className="text-[0.6rem] font-medium uppercase tracking-wider text-muted-foreground">
            {t("Net", "Neto")}
          </span>
          <span
            className={`mt-0.5 font-mono text-sm font-semibold sm:text-base ${
              summary.netCashFlow >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatCurrency(summary.netCashFlow, baseCurrency)}
          </span>
        </div>
        <div className="flex flex-col rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
          <span className="text-[0.6rem] font-medium uppercase tracking-wider text-muted-foreground">
            {t("Income", "Ingresos")}
          </span>
          <span className="mt-0.5 font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 sm:text-base">
            {formatCurrency(summary.totalIncome, baseCurrency)}
          </span>
        </div>
        <div className="flex flex-col rounded-2xl border border-red-500/20 bg-red-500/5 px-3 py-2.5">
          <span className="text-[0.6rem] font-medium uppercase tracking-wider text-muted-foreground">
            {t("Expenses", "Gastos")}
          </span>
          <span className="mt-0.5 font-mono text-sm font-semibold text-red-600 dark:text-red-400 sm:text-base">
            {formatCurrency(summary.totalExpense, baseCurrency)}
          </span>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
        {/* ── Calendar grid ── */}
        <Card className="border-border/80 bg-card/96">
          <CardContent className="p-2 sm:p-3 md:p-4">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="py-1.5 text-center text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted-foreground md:py-2 md:text-[0.68rem] md:tracking-[0.24em]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {calendarCells.map((day, i) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[3.5rem] sm:min-h-[4rem] md:min-h-[7rem]"
                    />
                  );
                }

                const key = dateKey(year, month, day);
                const data = dayMap.get(key);
                const totals = dayTotals.get(day);
                const hasIncome = data && data.incomes.length > 0;
                const hasExpense = data && data.expenses.length > 0;
                const hasRecurring = data && data.recurringBills.length > 0;
                const isToday = isCurrentMonth && day === todayDay;
                const isSelected = day === selectedDay;
                const entries = getDayEntries(data);
                const visibleEntries = entries.slice(0, MAX_CELL_ITEMS);
                const overflowCount = Math.max(0, entries.length - MAX_CELL_ITEMS);

                const net = totals ? totals.income - totals.expense : 0;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setSelectedDay(day === selectedDay ? null : day)
                    }
                    className={`group relative flex min-h-[3.5rem] flex-col items-stretch rounded-lg border p-1 text-left transition-all duration-150 sm:min-h-[4rem] sm:p-1.5 md:min-h-[7rem] md:rounded-xl md:p-1.5 ${
                      isSelected
                        ? "border-foreground/20 bg-secondary ring-1 ring-foreground/10"
                        : isToday
                          ? "border-emerald-500/30 bg-emerald-500/8"
                          : "border-border/40 bg-card/60 hover:border-foreground/10 hover:bg-secondary/40"
                    }`}
                  >
                    {/* ── Day number + mobile daily amount ── */}
                    <div className="flex items-start justify-between gap-0.5">
                      <span
                        className={`text-[0.65rem] font-medium leading-none sm:text-xs md:text-xs ${
                          isToday
                            ? "font-bold text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {day}
                      </span>

                      {/* Mobile & tablet: compact daily net */}
                      {totals && (
                        <span
                          className={`font-mono text-[0.45rem] font-semibold leading-none sm:text-[0.55rem] md:hidden ${
                            net >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-500 dark:text-red-400"
                          }`}
                        >
                          {net >= 0 ? "+" : ""}
                          {compactAmount(net, baseCurrency, locale)}
                        </span>
                      )}
                    </div>

                    {/* ── Mobile & tablet: colored indicator bars ── */}
                    {(hasIncome || hasExpense || hasRecurring) && (
                      <div className="mt-auto flex items-center gap-0.5 md:hidden">
                        {hasIncome && (
                          <span className="h-[3px] w-3 rounded-full bg-emerald-500" />
                        )}
                        {hasExpense && (
                          <span className="h-[3px] w-3 rounded-full bg-red-500" />
                        )}
                        {hasRecurring && (
                          <span className="h-[3px] w-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                    )}

                    {/* ── Desktop: transaction entry previews ── */}
                    <div className="mt-1 hidden flex-1 flex-col gap-[3px] overflow-hidden md:flex">
                      {visibleEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`flex items-center gap-1 rounded px-1 py-[2px] text-[0.58rem] leading-tight ${
                            entry.type === "income"
                              ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                              : entry.type === "recurring"
                                ? "bg-blue-500/12 text-blue-700 dark:text-blue-400"
                                : "bg-red-500/10 text-red-700 dark:text-red-400"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {entry.label}
                          </span>
                          <span className="shrink-0 font-mono text-[0.55rem] font-semibold">
                            {entry.type === "income" ? "+" : "-"}
                            {compactAmount(entry.amount, entry.currency, locale)}
                          </span>
                        </div>
                      ))}
                      {overflowCount > 0 && (
                        <span className="pl-1 text-[0.5rem] text-muted-foreground">
                          +{overflowCount} {t("more", "más")}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-border/40 pt-2 text-[0.65rem] text-muted-foreground md:mt-3 md:gap-4 md:pt-3 md:text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 md:h-2 md:w-2" />
                {t("Income", "Ingreso")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 md:h-2 md:w-2" />
                {t("Expense", "Gasto")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 md:h-2 md:w-2" />
                {t("Recurring", "Recurrente")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Desktop sidebar ── */}
        <div className="hidden xl:block">
          <div className="sticky top-6 space-y-4">
            {/* Cash flow summary */}
            <Card className="border-border/80 bg-card/96">
              <CardHeader className="space-y-2 pb-3">
                <Badge variant="outline" className="bg-secondary/70 text-foreground">
                  {t("Cash flow", "Flujo de efectivo")}
                </Badge>
                <CardTitle className="font-heading text-[1.5rem] font-semibold leading-none tracking-[-0.04em]">
                  {formatCurrency(summary.netCashFlow, baseCurrency)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {summary.netCashFlow >= 0
                    ? t("Net positive this month", "Flujo positivo este mes")
                    : t("Net negative this month", "Flujo negativo este mes")}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/40 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                    {t("Income", "Ingresos")}
                  </span>
                  <span className="font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.totalIncome, baseCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/40 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                    {t("Expenses", "Gastos")}
                  </span>
                  <span className="font-mono text-sm font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(summary.totalExpense, baseCurrency)}
                  </span>
                </div>
                {summary.upcomingBillCount > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/8 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Repeat className="h-3.5 w-3.5 text-blue-500" />
                      {t(
                        `${summary.upcomingBillCount} upcoming`,
                        `${summary.upcomingBillCount} pendiente${summary.upcomingBillCount !== 1 ? "s" : ""}`
                      )}
                    </span>
                    <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(summary.upcomingBills, baseCurrency)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Desktop: selected day detail */}
            <AnimatePresence mode="wait">
              {renderDayDetail()}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── Mobile / tablet: selected day detail (full-width below calendar) ── */}
      <div className="xl:hidden">
        <AnimatePresence mode="wait">
          {renderDayDetail()}
        </AnimatePresence>
      </div>
    </div>
  );
}
