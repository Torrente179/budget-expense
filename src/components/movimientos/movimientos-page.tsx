"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomes } from "@/hooks/use-incomes";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import {
  cn,
  formatCurrency,
  formatDate,
  getCurrentMonth,
  getCurrentYear,
} from "@/lib/utils";
import { MonthPicker } from "@/components/shared/month-picker";
import { CategoryIcon } from "@/components/shared/category-badge";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { IncomeForm } from "@/components/incomes/income-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Database } from "@/types/database";

type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};
type Income = Database["public"]["Tables"]["income_entries"]["Row"];

type Movement = {
  id: string;
  type: "expense" | "income";
  name: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  currency: string;
  date: string;
  expense?: Expense;
  income?: Income;
};

type TabFilter = "all" | "expenses" | "incomes";

export function MovimientosPage() {
  const { t } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [tab, setTab] = useState<TabFilter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: "expense" | "income";
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    expenses,
    loading: loadingExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses({ month, year, search: deferredSearch || undefined });

  const {
    incomes,
    loading: loadingIncomes,
    addIncome,
    updateIncome,
    deleteIncome,
  } = useIncomes({ month, year, search: deferredSearch || undefined });

  const loading = loadingExpenses || loadingIncomes;

  const movements = useMemo<Movement[]>(() => {
    const expenseItems: Movement[] = expenses.map((e) => ({
      id: e.id,
      type: "expense",
      name: e.description || e.categories?.name || "—",
      category: e.categories?.name || "—",
      categoryIcon: e.categories?.icon || "receipt",
      categoryColor: e.categories?.color || "#64748b",
      amount: e.amount,
      currency: e.currency,
      date: e.date,
      expense: e,
    }));

    const incomeItems: Movement[] = incomes.map((i) => ({
      id: i.id,
      type: "income",
      name: i.source,
      category: i.description || t("Income", "Ingreso"),
      categoryIcon: "trending-up",
      categoryColor: "#10b981",
      amount: i.amount,
      currency: i.currency,
      date: i.date,
      income: i,
    }));

    let all = [...expenseItems, ...incomeItems];
    if (tab === "expenses") all = all.filter((m) => m.type === "expense");
    else if (tab === "incomes") all = all.filter((m) => m.type === "income");

    return all.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, incomes, tab, t]);

  const totalIncome = useMemo(
    () => incomes.reduce((sum, i) => sum + convert(i.amount, i.currency), 0),
    [convert, incomes]
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + convert(e.amount, e.currency), 0),
    [convert, expenses]
  );
  const netBalance = totalIncome - totalExpenses;

  const grouped = useMemo(() => {
    const map = new Map<string, Movement[]>();
    for (const m of movements) {
      const existing = map.get(m.date) ?? [];
      existing.push(m);
      map.set(m.date, existing);
    }
    return map;
  }, [movements]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.type === "expense") {
      await deleteExpense(deleteTarget.id);
    } else {
      await deleteIncome(deleteTarget.id);
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: t("All", "Todos") },
    { key: "expenses", label: t("Expenses", "Gastos") },
    { key: "incomes", label: t("Income", "Ingresos") },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-[1.75rem] font-semibold leading-none tracking-[-0.04em] text-foreground sm:text-[2.45rem]">
          {t("Movements", "Movimientos")}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-2xl border border-border bg-secondary/80 md:hidden",
              searchOpen && "bg-foreground text-background"
            )}
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) setSearch("");
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("Search...", "Buscar...")}
              className="h-9 w-[200px] rounded-2xl pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mobile search (expanded) */}
      {searchOpen && (
        <div className="md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("Search movements...", "Buscar movimientos...")}
              className="h-10 rounded-2xl pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Summary card */}
      <div className="rounded-[1.25rem] border border-border/80 bg-card/96 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <MonthPicker
            month={month}
            year={year}
            onChange={(m, y) => {
              setMonth(m);
              setYear(y);
            }}
          />
          <p
            className={cn(
              "font-heading text-[1.65rem] font-semibold leading-none tracking-[-0.04em]",
              netBalance < 0 && "text-destructive"
            )}
          >
            {formatCurrency(netBalance, baseCurrency)}
          </p>
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span>
            {t("Income", "Ingresos")}:{" "}
            <span className="font-medium text-emerald-400">
              {formatCurrency(totalIncome, baseCurrency)}
            </span>
          </span>
          <span>
            {t("Expenses", "Gastos")}:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(totalExpenses, baseCurrency)}
            </span>
          </span>
        </div>
      </div>

      {/* Tabs + quick add */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex gap-6 border-b border-border/60">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              className={cn(
                "pb-2.5 text-sm font-medium transition-colors",
                tab === tabItem.key
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground"
              )}
              onClick={() => setTab(tabItem.key)}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 pb-1">
          <ExpenseForm
            onSubmit={addExpense}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 rounded-xl px-2 text-[0.68rem]"
              >
                <Plus className="h-3 w-3" />
                {t("Expense", "Gasto")}
              </Button>
            }
          />
          <IncomeForm
            onSubmit={addIncome}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 rounded-xl px-2 text-[0.68rem]"
              >
                <Plus className="h-3 w-3" />
                {t("Income", "Ingreso")}
              </Button>
            }
          />
        </div>
      </div>

      {/* Movements list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[3.25rem] animate-pulse rounded-xl bg-muted/50"
            />
          ))}
        </div>
      ) : movements.length === 0 ? (
        <EmptyState
          icon={ArrowUpDown}
          title={t("No movements", "Sin movimientos")}
          description={t(
            "Add your first expense or income to see it here.",
            "Agrega tu primer gasto o ingreso para verlo aquí."
          )}
        />
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([date, items]) => (
            <div key={date}>
              <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {formatDate(date, "EEEE d MMMM yyyy")}
              </p>
              <div className="divide-y divide-border/40">
                {items.map((movement) => {
                  const convertedAmount = convert(
                    movement.amount,
                    movement.currency
                  );
                  const isExpense = movement.type === "expense";

                  const rowContent = (
                    <button className="flex w-full items-center gap-3 py-3 text-left transition-colors active:bg-secondary/40">
                      {isExpense ? (
                        <CategoryIcon
                          icon={movement.categoryIcon}
                          color={movement.categoryColor}
                          className="h-9 w-9 shrink-0 rounded-xl"
                        />
                      ) : (
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-[0_16px_36px_-24px_rgba(0,0,0,0.52)]"
                          style={{
                            backgroundColor: "#10b98115",
                            borderColor: "#10b98124",
                          }}
                        >
                          <TrendingUp
                            className="h-4 w-4"
                            style={{ color: "#10b981" }}
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {movement.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {movement.category}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 font-mono text-sm font-semibold tabular-nums",
                          isExpense ? "text-foreground" : "text-emerald-400"
                        )}
                      >
                        {isExpense ? "-" : "+"}
                        {formatCurrency(convertedAmount, baseCurrency)}
                      </p>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    </button>
                  );

                  return (
                    <div
                      key={`${movement.type}-${movement.id}`}
                      className="group flex items-center"
                    >
                      <div className="min-w-0 flex-1">
                        {isExpense && movement.expense ? (
                          <ExpenseForm
                            defaultValues={{
                              amount: movement.expense.amount,
                              currency: movement.expense.currency,
                              category_id: movement.expense.category_id,
                              description:
                                movement.expense.description ?? "",
                              date: movement.expense.date,
                            }}
                            onSubmit={async (values) =>
                              updateExpense(movement.expense!.id, values)
                            }
                            trigger={rowContent}
                          />
                        ) : movement.income ? (
                          <IncomeForm
                            defaultValues={{
                              amount: movement.income.amount,
                              currency: movement.income.currency,
                              source: movement.income.source,
                              description:
                                movement.income.description ?? "",
                              date: movement.income.date,
                            }}
                            onSubmit={async (values) =>
                              updateIncome(movement.income!.id, values)
                            }
                            trigger={rowContent}
                          />
                        ) : null}
                      </div>
                      <button
                        className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl opacity-30 transition-opacity hover:bg-destructive/10 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        onClick={() =>
                          setDeleteTarget({
                            id: movement.id,
                            type: movement.type,
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-[1.75rem] border-border/70 bg-popover/96 p-5 sm:max-w-[380px]">
          <DialogHeader className="space-y-3">
            <DialogTitle>
              {deleteTarget?.type === "expense"
                ? t("Delete expense", "Eliminar gasto")
                : t("Delete income", "Eliminar ingreso")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "This movement will be removed. Totals will recalculate automatically.",
                "Este movimiento se eliminará. Los totales se recalcularán automáticamente."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-[1.35rem] border-t border-border/60 bg-secondary/45 p-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {t("Cancel", "Cancelar")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              {t("Delete", "Eliminar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
