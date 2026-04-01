"use client";

import { useState, useDeferredValue } from "react";
import { useExpenses } from "@/hooks/use-expenses";
import { useInvestmentSavings } from "@/hooks/use-investment-savings";
import { useCurrency } from "@/providers/currency-provider";
import { PageHeader } from "@/components/layout/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { RecurringExpenseSection } from "@/components/expenses/recurring-expense-section";
import { SavingsTransferForm } from "@/components/investments/savings-transfer-form";
import { SavingsTransferTable } from "@/components/investments/savings-transfer-table";
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

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + convert(e.amount, e.currency),
    0
  );
  const {
    savingsAccounts,
    savingsTransfers,
    loading: savingsLoading,
    addSavingsTransfer,
    updateSavingsTransfer,
    deleteSavingsTransfer,
    refetch: refetchSavings,
  } = useInvestmentSavings({ month, year });
  const totalSavingsTransfers = savingsTransfers.reduce(
    (sum, transfer) => sum + convert(Number(transfer.amount), transfer.currency),
    0
  );
  const combinedOutflow = totalExpenses + totalSavingsTransfers;
  const totalExpenseMovements = expenses.length + savingsTransfers.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Expenses", "Gastos")}
        description={
          !loading && totalExpenseMovements > 0
            ? t(
                `${totalExpenseMovements} movement${totalExpenseMovements !== 1 ? "s" : ""} — ${formatCurrency(combinedOutflow, baseCurrency)} total outflow`,
                `${totalExpenseMovements} movimiento${totalExpenseMovements !== 1 ? "s" : ""} — ${formatCurrency(combinedOutflow, baseCurrency)} salida total`
              )
            : undefined
        }
      >
        <ExpenseForm onSubmit={addExpense} />
        <SavingsTransferForm
          accounts={savingsAccounts}
          onSubmit={addSavingsTransfer}
          sourceKind="expense_flow"
          title={{
            create: t("Add investment movement", "Agregar movimiento de inversion"),
            edit: t("Edit investment movement", "Editar movimiento de inversion"),
          }}
          helperText={{
            en: "Register an investment movement from Expenses and send it to one of your savings accounts.",
            es: "Registra un movimiento de inversion desde Gastos y envialo a una de tus cuentas de ahorro.",
          }}
        />
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
        onChanged={() => {
          void refetch();
          void refetchSavings();
        }}
      />

      <ExpenseTable
        expenses={expenses}
        loading={loading}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
      />

      <SavingsTransferTable
        transfers={savingsTransfers}
        accounts={savingsAccounts}
        loading={savingsLoading}
        onUpdate={updateSavingsTransfer}
        onDelete={deleteSavingsTransfer}
      />
    </div>
  );
}
