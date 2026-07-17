import { createClient } from "@/lib/supabase/client";
import { getBudgetingMethodById } from "@/lib/budgeting-methods";
import { buildPersonalization } from "@/lib/onboarding/personalize";
import type { PrimaryGoal } from "@/lib/onboarding/goals";
import { getCurrentMonth, getCurrentYear, type AppLocale } from "@/lib/utils";

/**
 * Persist onboarding answers: monthly plan, optional seeded envelopes.
 */
export async function applyOnboardingPersonalization(input: {
  locale: AppLocale;
  incomeAmount: number;
  incomeCurrency: string;
  wantsBudgetHelp: boolean;
  goals: PrimaryGoal[];
  hasDebts: boolean;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const month = getCurrentMonth();
  const year = getCurrentYear();
  const plan = buildPersonalization({
    wantsBudgetHelp: input.wantsBudgetHelp,
    goals: input.goals,
    hasDebts: input.hasDebts,
  });

  const method = plan.methodId
    ? getBudgetingMethodById(input.locale, plan.methodId)
    : null;
  const allocationPercent = method
    ? method.slices.reduce((sum, slice) => sum + slice.percent, 0)
    : plan.allocationPercent;

  await supabase.from("monthly_budget_plans").upsert(
    {
      user_id: user.id,
      month,
      year,
      income_amount: input.incomeAmount,
      income_currency: input.incomeCurrency,
      allocation_percent: allocationPercent,
    },
    { onConflict: "user_id,month,year" }
  );

  if (!input.wantsBudgetHelp || plan.seedEnvelopes.length === 0) {
    return plan;
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, classification, name")
    .or(`user_id.eq.${user.id},is_default.eq.true`);

  const categoryRows = categories ?? [];

  for (const envelope of plan.seedEnvelopes) {
    const name = input.locale === "es" ? envelope.nameEs : envelope.name;
    const matchedIds = categoryRows
      .filter((category) =>
        envelope.classificationHints.includes(
          category.classification as
            | "essential"
            | "discretionary"
            | "giving"
            | "savings"
        )
      )
      .map((category) => category.id)
      .slice(0, 4);

    if (matchedIds.length === 0) continue;

    const { data: inserted } = await supabase
      .from("custom_budgets")
      .upsert(
        {
          user_id: user.id,
          name,
          amount_type: envelope.amount_type,
          amount_value: envelope.amount_value,
          currency: input.incomeCurrency,
          month,
          year,
        },
        { onConflict: "user_id,name,month,year" }
      )
      .select("id")
      .single();

    if (!inserted) continue;

    await supabase
      .from("custom_budget_categories")
      .delete()
      .eq("custom_budget_id", inserted.id);

    await supabase.from("custom_budget_categories").insert(
      matchedIds.map((category_id) => ({
        custom_budget_id: inserted.id,
        category_id,
      }))
    );
  }

  return plan;
}
