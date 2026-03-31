"use client";

import { useState, useDeferredValue } from "react";
import { useExpenses } from "@/hooks/use-expenses";
import { useCurrency } from "@/providers/currency-provider";
import { PageHeader } from "@/components/layout/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { getCurrentMonth, getCurrentYear, formatCurrency } from "@/lib/utils";

export default function ExpensesPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const { baseCurrency, convert } = useCurrency();

  const { expenses, loading, addExpense, updateExpense, deleteExpense } =
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
        title="Expenses"
        description={
          !loading && expenses.length > 0
            ? `${expenses.length} expense${expenses.length !== 1 ? "s" : ""} — ${formatCurrency(total, baseCurrency)} total`
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

      <ExpenseTable
        expenses={expenses}
        loading={loading}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
      />
    </div>
  );
}
