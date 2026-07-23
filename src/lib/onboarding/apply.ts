import { createClient } from "@/lib/supabase/client";
import { isGivingName } from "@/lib/giving";
import { buildPersonalization } from "@/lib/onboarding/personalize";
import type { PrimaryGoal } from "@/lib/onboarding/goals";
import { MONTHLY_PLAN_FULL_ALLOCATION } from "@/lib/validations";
import { getCurrentMonth, getCurrentYear, type AppLocale } from "@/lib/utils";

/**
 * Persist onboarding answers: monthly plan, optional seeded envelopes.
 * Giving / Generosidad is always a % of plan income — never tied to expenses.
 */
export async function applyOnboardingPersonalization(input: {
  locale: AppLocale;
  incomeAmount: number;
  incomeCurrency: string;
  wantsBudgetHelp: boolean;
  goals: PrimaryGoal[];
  hasDebts: boolean;
  /** User-picked budget method; overrides the goal-based suggestion. */
  methodId?: string | null;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (error || !userId) throw error ?? new Error("Unauthorized");

  const month = getCurrentMonth();
  const year = getCurrentYear();
  const plan = buildPersonalization({
    wantsBudgetHelp: input.wantsBudgetHelp,
    goals: input.goals,
    hasDebts: input.hasDebts,
    methodId: input.methodId,
  });

  await supabase.from("monthly_budget_plans").upsert(
    {
      user_id: userId,
      month,
      year,
      income_amount: input.incomeAmount,
      income_currency: input.incomeCurrency,
      allocation_percent: MONTHLY_PLAN_FULL_ALLOCATION,
    },
    { onConflict: "user_id,month,year" }
  );

  // Giving target lives on the profile as % of income.
  if (input.goals.includes("give_generously")) {
    await supabase
      .from("profiles")
      .update({ tithe_target_percent: 10 })
      .eq("id", userId);
  }

  if (!input.wantsBudgetHelp || plan.seedEnvelopes.length === 0) {
    return plan;
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, classification, name")
    .or(`user_id.eq.${userId},is_default.eq.true`);

  let categoryRows = categories ?? [];

  // Ensure a dedicated giving category exists so Generosidad never attaches
  // to essentials/lifestyle spend by accident.
  const hasGivingCategory = categoryRows.some(
    (category) =>
      category.classification === "giving" || isGivingName(category.name)
  );
  if (
    !hasGivingCategory &&
    plan.seedEnvelopes.some((envelope) =>
      envelope.classificationHints.includes("giving")
    )
  ) {
    const titheName = input.locale === "es" ? "Diezmo" : "Tithe";
    const { data: created } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: titheName,
        icon: "hand-heart",
        color: "#10b981",
        is_default: false,
        classification: "giving",
      })
      .select("id, classification, name")
      .maybeSingle();
    if (created) {
      categoryRows = [...categoryRows, created];
    }
  }

  for (const envelope of plan.seedEnvelopes) {
    const name = input.locale === "es" ? envelope.nameEs : envelope.name;
    const matchedIds = categoryRows
      .filter((category) => {
        const classification = category.classification as
          | "essential"
          | "discretionary"
          | "giving"
          | "savings"
          | null;
        if (
          classification &&
          envelope.classificationHints.includes(classification)
        ) {
          return true;
        }
        // Giving envelopes may also match by name (Tithe / Diezmo / Donaciones).
        return (
          envelope.classificationHints.includes("giving") &&
          isGivingName(category.name)
        );
      })
      .map((category) => category.id)
      .slice(0, 4);

    if (matchedIds.length === 0) continue;

    const { data: inserted } = await supabase
      .from("custom_budgets")
      .upsert(
        {
          user_id: userId,
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
