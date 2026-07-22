import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  computeEnvelopeAlerts,
  shouldToastEnvelopeAlert,
} from "@/lib/budgeting/envelope-alerts";
import { getMonthDateRange } from "@/lib/recurring-expenses";
import type { CustomBudget } from "@/hooks/use-custom-budgets";
import type { Database } from "@/types/database";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

export interface EnvelopeWriteContext {
  budgets: CustomBudget[];
  expenses: Array<
    Pick<ExpenseRow, "id" | "category_id" | "amount" | "currency" | "date">
  >;
  plan: {
    income_amount: number;
    income_currency: string;
  } | null;
}

/**
 * After an expense is saved, warn if any custom budget crossed 75/90/100%.
 * Deduped per envelope/threshold for the browser session.
 */
export async function notifyEnvelopeLimitsAfterExpense(input: {
  categoryId: string;
  date: string;
  convert: (amount: number, fromCurrency: string) => number;
  t: (english: string, spanish: string) => string;
  context?: EnvelopeWriteContext | null;
}) {
  const [yearString, monthString] = input.date.split("-");
  const month = Number(monthString);
  const year = Number(yearString);
  if (!month || !year) return;

  let context = input.context;
  if (!context) {
    const supabase = createClient();
    const { startDate, endDate } = getMonthDateRange(month, year);
    const [budgetsResult, expensesResult, planResult] = await Promise.all([
      supabase
        .from("custom_budgets")
        .select("*, custom_budget_categories(*, categories(*))")
        .eq("month", month)
        .eq("year", year),
      supabase
        .from("expenses")
        .select("id, amount, currency, category_id, date")
        .gte("date", startDate)
        .lt("date", endDate),
      supabase
        .from("monthly_budget_plans")
        .select("income_amount, income_currency")
        .eq("month", month)
        .eq("year", year)
        .maybeSingle(),
    ]);
    context = {
      budgets: (budgetsResult.data ?? []) as CustomBudget[],
      expenses: expensesResult.data ?? [],
      plan: planResult.data,
    };
  }

  const budgets = context.budgets.filter((budget) =>
    budget.custom_budget_categories.some(
      (link) => link.category_id === input.categoryId
    )
  );
  if (budgets.length === 0) return;

  const incomeAmount = context.plan
    ? input.convert(
        Number(context.plan.income_amount),
        context.plan.income_currency
      )
    : null;

  const alerts = computeEnvelopeAlerts({
    budgets: budgets as never,
    expenses: context.expenses as ExpenseRow[],
    incomeAmount,
    convert: input.convert,
  });

  for (const alert of alerts) {
    if (!shouldToastEnvelopeAlert(alert.budgetId, alert.threshold)) continue;
    const percent = Math.round(alert.percentUsed);
    const message =
      alert.threshold >= 100
        ? input.t(
            `${alert.name} is over budget (${percent}%)`,
            `${alert.name} supera el presupuesto (${percent}%)`
          )
        : input.t(
            `${alert.name} is at ${percent}% of its budget`,
            `${alert.name} va al ${percent}% de su presupuesto`
          );
    if (alert.threshold >= 90) {
      toast.error(message, {
        action: {
          label: input.t("Budget", "Presupuesto"),
          onClick: () => {
            window.location.href = "/budget";
          },
        },
      });
    } else {
      toast.warning(message, {
        action: {
          label: input.t("Budget", "Presupuesto"),
          onClick: () => {
            window.location.href = "/budget";
          },
        },
      });
    }
  }
}
