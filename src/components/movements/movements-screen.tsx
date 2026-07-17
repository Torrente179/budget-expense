"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  Loader2,
  Plus,
  Repeat,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncomes } from "@/hooks/use-incomes";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePrefetchMonths } from "@/hooks/use-prefetch-months";
import { useMonth } from "@/providers/month-provider";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { cn, formatDate } from "@/lib/utils";
import { Screen } from "@/components/patterns/screen";
import { TransactionRow } from "@/components/patterns/transaction-row";
import { AmountText } from "@/components/patterns/amount-text";
import { MonthPicker } from "@/components/shared/month-picker";
import { PullToRefresh } from "@/components/shared/pull-to-refresh";
import { SwipeableRow } from "@/components/shared/swipeable-row";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CaptureSheet,
  type CaptureInitialValues,
  type CaptureKind,
} from "@/components/capture/capture-sheet";
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
  kind: "expense" | "income";
  title: string;
  subtitle: string;
  categoryIcon?: { icon: string; color: string } | null;
  amount: number;
  currency: string;
  date: string;
  needsReview: boolean;
  expense?: Expense;
  income?: Income;
};

type TabFilter = "all" | "expenses" | "income";

const TAB_VALUES: TabFilter[] = ["all", "expenses", "income"];

export function MovementsScreen() {
  const { t, tc } = useLocale();
  const { convert, baseCurrency } = useCurrency();
  const { month, year, setMonthYear } = useMonth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const tab: TabFilter = TAB_VALUES.includes(tabParam as TabFilter)
    ? (tabParam as TabFilter)
    : "all";

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [editTarget, setEditTarget] = useState<{
    kind: CaptureKind;
    values: CaptureInitialValues;
  } | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Movement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    expenses,
    loading: loadingExpenses,
    deleteExpense,
    refetch: refetchExpenses,
  } = useExpenses({ month, year, search: deferredSearch || undefined });
  const {
    incomes,
    loading: loadingIncomes,
    deleteIncome,
    refetch: refetchIncomes,
  } = useIncomes({ month, year, search: deferredSearch || undefined });

  const loading = loadingExpenses || loadingIncomes;
  usePrefetchMonths(month, year, loading);
  const isMobile = useMediaQuery("(max-width: 767px)");

  function setTab(next: TabFilter) {
    router.replace(next === "all" ? "/movements" : `/movements?tab=${next}`, {
      scroll: false,
    });
  }

  // Optimistic swipe-delete: hide instantly, commit after the undo window.
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const deleteTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  function swipeDelete(movement: Movement) {
    setPendingDeletes((previous) => new Set(previous).add(movement.id));

    const commit = async () => {
      deleteTimers.current.delete(movement.id);
      const error =
        movement.kind === "expense"
          ? await deleteExpense(movement.id)
          : await deleteIncome(movement.id);
      setPendingDeletes((previous) => {
        const next = new Set(previous);
        next.delete(movement.id);
        return next;
      });
      if (error) {
        toast.error(t("Could not delete", "No se pudo eliminar"));
      }
    };

    const timer = setTimeout(commit, 5000);
    deleteTimers.current.set(movement.id, timer);

    toast(t("Movement deleted", "Movimiento eliminado"), {
      duration: 5000,
      action: {
        label: t("Undo", "Deshacer"),
        onClick: () => {
          const pending = deleteTimers.current.get(movement.id);
          if (pending) {
            clearTimeout(pending);
            deleteTimers.current.delete(movement.id);
          }
          setPendingDeletes((previous) => {
            const next = new Set(previous);
            next.delete(movement.id);
            return next;
          });
        },
      },
    });
  }

  const movements = useMemo<Movement[]>(() => {
    const expenseItems: Movement[] = expenses.map((expense) => ({
      id: expense.id,
      kind: "expense",
      title: expense.description || tc(expense.categories?.name || "—"),
      subtitle: tc(expense.categories?.name || "—"),
      categoryIcon: expense.categories
        ? {
            icon: expense.categories.icon,
            color: expense.categories.color,
          }
        : null,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      needsReview: expense.needs_review,
      expense,
    }));

    const incomeItems: Movement[] = incomes.map((income) => ({
      id: income.id,
      kind: "income",
      title: income.source,
      subtitle: income.description || t("Income", "Ingreso"),
      amount: income.amount,
      currency: income.currency,
      date: income.date,
      needsReview: false,
      income,
    }));

    let all = [...expenseItems, ...incomeItems];
    if (tab === "expenses") all = all.filter((m) => m.kind === "expense");
    else if (tab === "income") all = all.filter((m) => m.kind === "income");
    all = all.filter((m) => !pendingDeletes.has(m.id));

    return all.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, incomes, tab, t, tc, pendingDeletes]);

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
    for (const movement of movements) {
      const existing = map.get(movement.date) ?? [];
      existing.push(movement);
      map.set(movement.date, existing);
    }
    return map;
  }, [movements]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.kind === "expense") {
      await deleteExpense(deleteTarget.id);
    } else {
      await deleteIncome(deleteTarget.id);
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  function openEdit(movement: Movement) {
    if (movement.kind === "expense" && movement.expense) {
      setEditTarget({
        kind: "expense",
        values: {
          id: movement.expense.id,
          amount: movement.expense.amount,
          currency: movement.expense.currency,
          categoryId: movement.expense.category_id,
          date: movement.expense.date,
          description: movement.expense.description ?? "",
        },
      });
    } else if (movement.income) {
      setEditTarget({
        kind: "income",
        values: {
          id: movement.income.id,
          amount: movement.income.amount,
          currency: movement.income.currency,
          source: movement.income.source,
          date: movement.income.date,
          description: movement.income.description ?? "",
        },
      });
    }
  }

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: t("All", "Todos") },
    { key: "expenses", label: t("Expenses", "Gastos") },
    { key: "income", label: t("Income", "Ingresos") },
  ];

  return (
    <Screen
      title={t("Movements", "Movimientos")}
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("Search", "Buscar")}
            className={cn(
              "h-9 w-9 rounded-full border border-border bg-secondary/80 md:hidden",
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
              className="h-9 w-[200px] rounded-full pl-9 text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("Recurring expenses", "Gastos recurrentes")}
            className="h-9 w-9 rounded-full border border-border bg-secondary/80"
            render={<Link href="/movements/recurring" />}
          >
            <Repeat className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden h-9 gap-1.5 rounded-full md:inline-flex"
            onClick={() => setCaptureOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t("Add", "Añadir")}
          </Button>
        </>
      }
      subheader={
        <div className="space-y-3">
          {searchOpen && (
            <div className="relative md:hidden">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("Search movements...", "Buscar movimientos...")}
                className="h-10 rounded-full pl-9 text-sm"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoFocus
              />
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label={t("Filter movements", "Filtrar movimientos")}
              className="grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1"
            >
              {tabs.map((tabItem) => (
                <button
                  key={tabItem.key}
                  role="tab"
                  aria-selected={tab === tabItem.key}
                  onClick={() => setTab(tabItem.key)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-caption font-medium transition-colors",
                    tab === tabItem.key
                      ? "bg-background text-foreground shadow-1"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>
            <MonthPicker month={month} year={year} onChange={setMonthYear} />
          </div>
        </div>
      }
    >
      {/* Month totals */}
      <div className="flex items-center justify-between gap-4 rounded-xl bg-card px-4 py-3 ring-1 ring-border shadow-1">
        <div className="flex gap-5 text-caption text-muted-foreground">
          <span>
            {t("Income", "Ingresos")}{" "}
            <AmountText
              amount={totalIncome}
              currency={baseCurrency}
              tone="positive"
              size="caption"
              className="font-medium"
            />
          </span>
          <span>
            {t("Expenses", "Gastos")}{" "}
            <AmountText
              amount={totalExpenses}
              currency={baseCurrency}
              size="caption"
              className="font-medium"
            />
          </span>
        </div>
        <AmountText
          amount={netBalance}
          currency={baseCurrency}
          size="heading"
          tone={netBalance < 0 ? "negative" : "default"}
        />
      </div>

      {/* Ledger */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
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
        <PullToRefresh
          onRefresh={() => Promise.all([refetchExpenses(), refetchIncomes()])}
        >
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([date, items]) => (
              <section key={date}>
                <p className="label-caps mb-1.5 px-4 md:px-0">
                  {formatDate(date, "EEEE d MMMM yyyy")}
                </p>
                <div className="-mx-4 divide-y divide-border/40 md:mx-0 md:overflow-hidden md:rounded-xl md:bg-card md:ring-1 md:ring-border md:shadow-1">
                  {items.map((movement) => (
                    <SwipeableRow
                      key={`${movement.kind}-${movement.id}`}
                      enabled={isMobile}
                      onDelete={() => swipeDelete(movement)}
                    >
                      <div className="group flex items-center bg-background md:bg-transparent">
                        <div className="min-w-0 flex-1">
                          <TransactionRow
                            title={movement.title}
                            subtitle={movement.subtitle}
                            amount={movement.amount}
                            currency={movement.currency}
                            kind={movement.kind}
                            category={movement.categoryIcon}
                            needsReview={movement.needsReview}
                            onClick={() => openEdit(movement)}
                          />
                        </div>
                        <button
                          aria-label={t("Delete", "Eliminar")}
                          className="mr-2 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-0 transition-opacity hover:bg-danger-subtle group-hover:opacity-100 md:flex"
                          onClick={() => setDeleteTarget(movement)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
                        </button>
                      </div>
                    </SwipeableRow>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </PullToRefresh>
      )}

      {/* Create (desktop button; mobile uses the FAB) */}
      <CaptureSheet open={captureOpen} onOpenChange={setCaptureOpen} />

      {/* Edit */}
      <CaptureSheet
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        mode="edit"
        kind={editTarget?.kind}
        initialValues={editTarget?.values}
      />

      {/* Delete confirmation (desktop) */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="p-5 sm:max-w-[380px]">
          <DialogHeader className="space-y-3">
            <DialogTitle>
              {deleteTarget?.kind === "expense"
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
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {t("Cancel", "Cancelar")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {t("Delete", "Eliminar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Screen>
  );
}
