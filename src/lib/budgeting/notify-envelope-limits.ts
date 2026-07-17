import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  computeEnvelopeAlerts,
  shouldToastEnvelopeAlert,
} from "@/lib/budgeting/envelope-alerts";
import { getMonthDateRange } from "@/lib/recurring-expenses";

/**
 * After an expense is saved, warn if any custom budget crossed 75/90/100%.
 * Deduped per envelope/threshold for the browser session.
 */
export async function notifyEnvelopeLimitsAfterExpense(input: {
  categoryId: string;
  date: string;
  convert: (amount: number, fromCurrency: string) => number;
  t: (english: string, spanish: string) => string;
}) {
  const [yearString, monthString] = input.date.split("-");
  const month = Number(monthString);
  const year = Number(yearString);
  if (!month || !year) return;

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
      .select("amount, currency, category_id, date")
      .gte("date", startDate)
      .lt("date", endDate),
    supabase
      .from("monthly_budget_plans")
      .select("income_amount, income_currency")
      .eq("month", month)
      .eq("year", year)
      .maybeSingle(),
  ]);

  const budgets = (budgetsResult.data ?? []).filter((budget) =>
    (budget.custom_budget_categories ?? []).some(
      (link: { category_id: string }) => link.category_id === input.categoryId
    )
  );
  if (budgets.length === 0) return;

  const incomeAmount = planResult.data
    ? input.convert(
        Number(planResult.data.income_amount),
        planResult.data.income_currency
      )
    : null;

  const alerts = computeEnvelopeAlerts({
    budgets: budgets as never,
    expenses: (expensesResult.data ?? []) as never,
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
