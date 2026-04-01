"use client";

import { useState, useDeferredValue } from "react";
import { useExpenses } from "@/hooks/use-expenses";
import { useCurrency } from "@/providers/currency-provider";
import { PageHeader } from "@/components/layout/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { RecurringExpenseSection } from "@/components/expenses/recurring-expense-section";
import { getCurrentMonth, getCurrentYear, formatCurrency } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

export default function ExpensesPage() {
  const { t } = useLocale();
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const { baseCurrency, convert } = useCurrency();

  const {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch,
  } =
    useExpenses({
      month,
      year,
      categoryId: categoryId === "all" ? undefined : categoryId,
      search: deferredSearch || undefined,
    });

  const total = expenses.reduce(
    (sum, e) => sum + convert(e.amount, e.currency),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Expenses", "Gastos")}
        description={
          !loading && expenses.length > 0
            ? t(
                `${expenses.length} expense${expenses.length !== 1 ? "s" : ""} — ${formatCurrency(total, baseCurrency)} total`,
                `${expenses.length} gasto${expenses.length !== 1 ? "s" : ""} — ${formatCurrency(total, baseCurrency)} en total`
              )
            : undefined
        }
      >
        <ExpenseForm onSubmit={addExpense} />
      </PageHeader>

      <ExpenseFilters
        month={month}
        year={year}
        onMonthChange={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        search={search}
        onSearchChange={setSearch}
      />

      <RecurringExpenseSection
        month={month}
        year={year}
        onChanged={refetch}
      />

      <ExpenseTable
        expenses={expenses}
        loading={loading}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
      />
    </div>
  );
}
