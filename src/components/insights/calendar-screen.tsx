"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Repeat } from "lucide-react";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomes } from "@/hooks/use-incomes";
import { useRecurringExpenses } from "@/hooks/use-recurring-expenses";
import { useMonthSnapshot } from "@/hooks/use-month-snapshot";
import { useMonth } from "@/providers/month-provider";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import {
  isBalanceAdjustmentName,
  translateBalanceAdjustmentName,
} from "@/lib/balance-checkpoint";
import { cn, formatCurrency } from "@/lib/utils";
import { getTodayIsoDate } from "@/lib/calendar";
import { Screen } from "@/components/patterns/screen";
import { TransactionRow } from "@/components/patterns/transaction-row";
import { MonthPicker } from "@/components/shared/month-picker";
import { CategoryIcon } from "@/components/shared/category-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

interface DayEntry {
  id: string;
  kind: "income" | "expense" | "recurring";
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
  category: { icon: string; color: string } | null;
}

/** Month calendar of income, expenses, and upcoming recurring bills. */
export function CalendarScreen() {
  const { t, tc, intlLocale, locale } = useLocale();
  const { convert, baseCurrency } = useCurrency();
  const { month, year, setMonthYear } = useMonth();
  const searchParams = useSearchParams();
  useMonthSnapshot({ month, year, asOfDate: getTodayIsoDate() });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { expenses, loading: loadingExpenses } = useExpenses({ month, year });
  const { incomes, loading: loadingIncomes } = useIncomes({ month, year });
  const { recurringExpenses } = useRecurringExpenses();
  const loading = loadingExpenses || loadingIncomes;

  const today = new Date();
  const isCurrentMonth =
    today.getMonth() + 1 === month && today.getFullYear() === year;
  const todayDay = today.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const dayFromQuery = Number(searchParams.get("day"));

  useEffect(() => {
    if (!Number.isFinite(dayFromQuery)) return;
    if (dayFromQuery >= 1 && dayFromQuery <= daysInMonth) {
      setSelectedDay(dayFromQuery);
    }
  }, [dayFromQuery, daysInMonth]);

  const dayEntries = useMemo(() => {
    const map = new Map<number, DayEntry[]>();
    const push = (day: number, entry: DayEntry) => {
      const existing = map.get(day) ?? [];
      existing.push(entry);
      map.set(day, existing);
    };

    for (const income of incomes) {
      const day = Number(income.date.slice(8, 10));
      push(day, {
        id: income.id,
        kind: "income",
        title: translateBalanceAdjustmentName(income.source, locale),
        subtitle: isBalanceAdjustmentName(income.source)
          ? t("Income", "Ingreso")
          : income.description || t("Income", "Ingreso"),
        amount: income.amount,
        currency: income.currency,
        category: null,
      });
    }

    for (const expense of expenses) {
      const day = Number(expense.date.slice(8, 10));
      push(day, {
        id: expense.id,
        kind: "expense",
        title:
          translateBalanceAdjustmentName(expense.description, locale) ||
          tc(expense.categories?.name ?? "—"),
        subtitle: tc(expense.categories?.name ?? "—"),
        amount: expense.amount,
        currency: expense.currency,
        category: expense.categories
          ? { icon: expense.categories.icon, color: expense.categories.color }
          : null,
      });
    }

    for (const recurring of recurringExpenses) {
      if (!recurring.is_active) continue;
      const day = Math.min(recurring.charge_day, daysInMonth);
      const alreadyCharged = expenses.some(
        (expense) =>
          expense.recurring_expense_id === recurring.id &&
          Number(expense.date.slice(8, 10)) === day
      );
      if (alreadyCharged) continue;
      push(day, {
        id: `recurring-${recurring.id}`,
        kind: "recurring",
        title:
          recurring.description || tc(recurring.categories?.name ?? "—"),
        subtitle: t("Recurring bill", "Cargo recurrente"),
        amount: recurring.amount,
        currency: recurring.currency,
        category: recurring.categories
          ? {
              icon: recurring.categories.icon,
              color: recurring.categories.color,
            }
          : null,
      });
    }

    return map;
  }, [incomes, expenses, recurringExpenses, daysInMonth, t, tc, locale]);

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(intlLocale, {
      weekday: "narrow",
    });
    // 2023-01-01 was a Sunday; grid starts on Sunday.
    return Array.from({ length: 7 }, (_, i) =>
      formatter.format(new Date(2023, 0, 1 + i))
    );
  }, [intlLocale]);

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedEntries = selectedDay
    ? (dayEntries.get(selectedDay) ?? [])
    : [];

  const selectedDateLabel =
    selectedDay !== null
      ? new Intl.DateTimeFormat(intlLocale, {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(new Date(`${year}-${pad2(month)}-${pad2(selectedDay)}T00:00:00`))
      : "";

  function dayExpenseTotal(entries: DayEntry[]) {
    return entries
      .filter((entry) => entry.kind !== "income")
      .reduce((sum, entry) => sum + convert(entry.amount, entry.currency), 0);
  }

  return (
    <Screen
      title={t("Calendar", "Calendario")}
      backHref="/insights"
      actions={<MonthPicker month={month} year={year} onChange={setMonthYear} />}
    >
      {loading ? (
        <Skeleton className="h-[480px] rounded-xl" />
      ) : (
        <div className="rounded-xl bg-card p-2 ring-1 ring-border shadow-1 sm:p-3">
          <div className="grid grid-cols-7">
            {weekdayLabels.map((label, index) => (
              <div
                key={`${label}-${index}`}
                className="label-caps py-2 text-center"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} />;
              }
              const entries = dayEntries.get(day) ?? [];
              const hasIncome = entries.some((e) => e.kind === "income");
              const hasRecurring = entries.some((e) => e.kind === "recurring");
              const expenseTotal = dayExpenseTotal(entries);
              const isToday = isCurrentMonth && day === todayDay;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  aria-label={`${day} ${t("day", "día")}`}
                  className={cn(
                    "flex min-h-14 flex-col items-center gap-0.5 rounded-lg p-1 pt-1.5 transition-colors hover:bg-accent/60 sm:min-h-[4.5rem]",
                    entries.length > 0 && "bg-secondary/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-caption font-medium",
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    )}
                  >
                    {day}
                  </span>
                  {expenseTotal > 0 && (
                    <span className="hidden font-mono text-label tabular-nums text-negative sm:block">
                      {new Intl.NumberFormat(intlLocale, {
                        style: "currency",
                        currency: baseCurrency,
                        maximumFractionDigits: 0,
                        notation: expenseTotal >= 10000 ? "compact" : "standard",
                      }).format(expenseTotal)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    {expenseTotal > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 sm:hidden" />
                    )}
                    {hasIncome && (
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    )}
                    {hasRecurring && (
                      <Repeat className="h-3 w-3 text-info" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 px-1">
        <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
          {t("Spending", "Gastos")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {t("Income", "Ingresos")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
          <Repeat className="h-3 w-3 text-info" />
          {t("Upcoming recurring", "Recurrente próximo")}
        </span>
      </div>

      {/* Day detail */}
      <Sheet
        open={selectedDay !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null);
        }}
      >
        <SheetContent side="bottom" className="gap-0 p-0">
          <SheetHeader className="px-5 pb-2 pt-4">
            <SheetTitle className="text-heading capitalize">
              {selectedDateLabel}
            </SheetTitle>
            {selectedEntries.length > 0 && (
              <p className="text-caption text-muted-foreground">
                {t(
                  `${selectedEntries.length} ${selectedEntries.length === 1 ? "movement" : "movements"}`,
                  `${selectedEntries.length} ${selectedEntries.length === 1 ? "movimiento" : "movimientos"}`
                )}
                {dayExpenseTotal(selectedEntries) > 0 && (
                  <>
                    {" · "}
                    <span className="font-mono tabular-nums text-negative">
                      {formatCurrency(
                        dayExpenseTotal(selectedEntries),
                        baseCurrency
                      )}
                    </span>{" "}
                    {t("out", "salida")}
                  </>
                )}
              </p>
            )}
          </SheetHeader>
          <div className="max-h-[55dvh] overflow-y-auto pb-2">
            {selectedEntries.length === 0 ? (
              <p className="px-5 py-6 text-body text-muted-foreground">
                {t("Nothing on this day.", "Nada en este día.")}
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {selectedEntries.map((entry) =>
                  entry.kind === "recurring" ? (
                    <div
                      key={entry.id}
                      className="flex min-h-16 items-center gap-3 px-4 py-2.5"
                    >
                      <CategoryIcon
                        icon={entry.category?.icon ?? "repeat"}
                        color={entry.category?.color ?? "var(--muted-foreground)"}
                        className="h-9 w-9 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body font-medium">
                          {entry.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-caption text-info">
                          <Repeat className="h-3 w-3" />
                          {entry.subtitle}
                        </p>
                      </div>
                      <span className="font-mono text-body tabular-nums text-negative">
                        {formatCurrency(
                          convert(entry.amount, entry.currency),
                          baseCurrency
                        )}
                      </span>
                    </div>
                  ) : (
                    <TransactionRow
                      key={entry.id}
                      title={entry.title}
                      subtitle={entry.subtitle}
                      amount={entry.amount}
                      currency={entry.currency}
                      kind={entry.kind}
                      category={entry.category}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Screen>
  );
}
