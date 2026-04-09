"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/category-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};

interface RecentExpensesProps {
  expenses: Expense[];
  maxItems?: number;
}

export function RecentExpenses({ expenses, maxItems = 5 }: RecentExpensesProps) {
  const { t, tc } = useLocale();
  const visibleExpenses = expenses.slice(0, maxItems);

  return (
    <Card className="border-border/80 bg-card/96">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
            {t("Ledger", "Registro")}
          </p>
          <CardTitle className="mt-2 font-heading text-[1.45rem] font-semibold tracking-tight">
            {t("Recent expenses", "Gastos recientes")}
          </CardTitle>
        </div>
        <Link
          href="/expenses"
          className="flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("View all", "Ver todo")}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("No expenses this month", "No hay gastos este mes")}
          </p>
        ) : (
          <div className="space-y-3">
            {visibleExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-border/70 bg-secondary/45 px-4 py-3 transition-colors duration-200 hover:bg-secondary/70"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {expense.description || tc(expense.categories.name)}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {formatDate(expense.date, "MMM d")}
                      </span>
                      <CategoryBadge
                        name={tc(expense.categories.name)}
                        icon={expense.categories.icon}
                        color={expense.categories.color}
                      />
                    </div>
                  </div>
                </div>
                <CurrencyDisplay
                  amount={expense.amount}
                  currency={expense.currency}
                  className="shrink-0 text-sm font-semibold text-foreground"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
