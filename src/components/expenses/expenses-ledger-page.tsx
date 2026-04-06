"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: Category | null;
};

interface ExpensesLedgerPageProps {
  initialMonth: number;
  initialYear: number;
  initialCategoryId: string;
  initialSearch: string;
  categories: Category[];
  expenses: Expense[];
  lastActivityAt: string | null;
}

export function ExpensesLedgerPage({
  initialMonth,
  initialYear,
  initialCategoryId,
  initialSearch,
  categories,
  expenses,
  lastActivityAt,
}: ExpensesLedgerPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { baseCurrency, convert } = useCurrency();
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  function replaceFilters(next: {
    month?: number;
    year?: number;
    categoryId?: string;
    search?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    const month = next.month ?? initialMonth;
    const year = next.year ?? initialYear;
    const categoryId = next.categoryId ?? initialCategoryId;
    const nextSearch = next.search ?? initialSearch;

    params.set("month", String(month));
    params.set("year", String(year));

    if (categoryId && categoryId !== "all") {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    } else {
      params.delete("search");
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  useEffect(() => {
    if (deferredSearch === initialSearch) {
      return;
    }

    replaceFilters({ search: deferredSearch });
    // We intentionally react to the deferred value only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  async function getAuthHeaders(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {};
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  async function addExpense(values: {
    amount: number;
    currency: string;
    category_id: string;
    date: string;
    description?: string;
  }) {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/expenses", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      return new Error(`Expense create failed with status ${response.status}`);
    }

    startTransition(() => {
      router.refresh();
    });

    return null;
  }

  async function updateExpense(
    id: string,
    values: Database["public"]["Tables"]["expenses"]["Update"]
  ) {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      return new Error(`Expense update failed with status ${response.status}`);
    }

    startTransition(() => {
      router.refresh();
    });

    return null;
  }

  async function deleteExpense(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/expenses/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers,
    });

    if (!response.ok) {
      return new Error(`Expense delete failed with status ${response.status}`);
    }

    startTransition(() => {
      router.refresh();
    });

    return null;
  }

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + convert(expense.amount, expense.currency),
    0
  );

  const lastActivityLabel = lastActivityAt
    ? t(
        `Last logged: ${formatDate(lastActivityAt, "MMM d, yyyy 'at' h:mm a", "en")}`,
        `Última edición: ${formatDate(lastActivityAt, "d MMM yyyy 'a las' h:mm a", "es")}`
      )
    : null;

  const summaryLine =
    expenses.length > 0
      ? t(
          `${expenses.length} expense${expenses.length !== 1 ? "s" : ""} — ${formatCurrency(totalExpenses, baseCurrency)} total`,
          `${expenses.length} gasto${expenses.length !== 1 ? "s" : ""} — ${formatCurrency(totalExpenses, baseCurrency)} en total`
        )
      : null;

  const description = [summaryLine, lastActivityLabel]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Expenses", "Gastos")}
        description={description || undefined}
      >
        <ExpenseForm onSubmit={addExpense} categories={categories} />
      </PageHeader>

      <ExpenseFilters
        month={initialMonth}
        year={initialYear}
        onMonthChange={(month, year) => replaceFilters({ month, year })}
        categoryId={initialCategoryId}
        onCategoryChange={(categoryId) => replaceFilters({ categoryId })}
        search={search}
        onSearchChange={setSearch}
        categories={categories}
      />

      <ExpenseTable
        expenses={expenses}
        loading={isPending}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
        categories={categories}
      />
    </div>
  );
}
