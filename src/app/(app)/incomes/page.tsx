"use client";

import { useDeferredValue, useState } from "react";
import { useIncomes } from "@/hooks/use-incomes";
import { useCurrency } from "@/providers/currency-provider";
import { getCurrentMonth, getCurrentYear, formatCurrency } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { PageHeader } from "@/components/layout/page-header";
import { IncomeForm } from "@/components/incomes/income-form";
import { IncomeFilters } from "@/components/incomes/income-filters";
import { IncomeTable } from "@/components/incomes/income-table";

export default function IncomesPage() {
  const { t } = useLocale();
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const { baseCurrency, convert } = useCurrency();

  const { incomes, loading, addIncome, updateIncome, deleteIncome } = useIncomes({
    month,
    year,
    search: deferredSearch || undefined,
  });

  const total = incomes.reduce((sum, income) => sum + convert(income.amount, income.currency), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Incomes", "Ingresos")}
        description={
          !loading && incomes.length > 0
            ? t(
                `${incomes.length} income${incomes.length !== 1 ? "s" : ""} — ${formatCurrency(total, baseCurrency)} total`,
                `${incomes.length} ingreso${incomes.length !== 1 ? "s" : ""} — ${formatCurrency(total, baseCurrency)} en total`
              )
            : undefined
        }
      >
        <IncomeForm onSubmit={addIncome} />
      </PageHeader>

      <IncomeFilters
        month={month}
        year={year}
        onMonthChange={(nextMonth, nextYear) => {
          setMonth(nextMonth);
          setYear(nextYear);
        }}
        search={search}
        onSearchChange={setSearch}
      />

      <IncomeTable
        incomes={incomes}
        loading={loading}
        onUpdate={updateIncome}
        onDelete={deleteIncome}
      />
    </div>
  );
}
