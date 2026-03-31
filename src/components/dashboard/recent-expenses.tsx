"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/category-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"];
};

interface RecentExpensesProps {
  expenses: Expense[];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Recent expenses</CardTitle>
        <Link
          href="/expenses"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No expenses this month
          </p>
        ) : (
          <div className="space-y-3">
            {expenses.slice(0, 5).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {expense.description || expense.categories.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(expense.date, "MMM d")}
                      </span>
                      <CategoryBadge
                        name={expense.categories.name}
                        icon={expense.categories.icon}
                        color={expense.categories.color}
                      />
                    </div>
                  </div>
                </div>
                <CurrencyDisplay
                  amount={expense.amount}
                  currency={expense.currency}
                  className="shrink-0 text-sm font-medium"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
