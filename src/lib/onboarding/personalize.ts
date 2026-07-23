import type { PrimaryGoal } from "@/lib/onboarding/goals";

export interface PersonalizationPlan {
  methodId: string | null;
  seedEnvelopes: Array<{
    name: string;
    nameEs: string;
    amount_type: "percentage";
    amount_value: number;
    classificationHints: Array<
      "essential" | "discretionary" | "giving" | "savings"
    >;
  }>;
  homeCtas: Array<"budget" | "movements" | "wealth" | "insights" | "liabilities">;
  attentionHints: Array<"pay_debt" | "decrease_expenses" | "finish_setup">;
}

/**
 * Deterministic mapping from onboarding answers → method, envelopes, CTAs.
 * Pass `methodId` to keep a user-chosen budget profile instead of the suggestion.
 */
export function buildPersonalization(input: {
  wantsBudgetHelp: boolean;
  goals: PrimaryGoal[];
  hasDebts: boolean;
  /** When set, overrides the goal-based method suggestion. */
  methodId?: string | null;
}): PersonalizationPlan {
  const goals = new Set(input.goals);
  let methodId: string | null = null;

  if (input.wantsBudgetHelp) {
    if (input.methodId) {
      methodId = input.methodId;
    } else if (goals.has("pay_debt") || input.hasDebts) {
      methodId = "60-30-10";
    } else if (goals.has("give_generously")) {
      methodId = "5-jars";
    } else if (goals.has("save_more") || goals.has("build_emergency_fund")) {
      methodId = "pay-yourself-first";
    } else if (goals.has("decrease_expenses")) {
      methodId = "50-30-20";
    } else if (goals.has("increase_wealth")) {
      methodId = "pay-yourself-first";
    } else {
      methodId = "50-30-20";
    }
  }

  const seedEnvelopes: PersonalizationPlan["seedEnvelopes"] = [];
  if (input.wantsBudgetHelp) {
    seedEnvelopes.push({
      name: "Essentials",
      nameEs: "Esenciales",
      amount_type: "percentage",
      amount_value: goals.has("pay_debt") ? 50 : 50,
      classificationHints: ["essential"],
    });
    seedEnvelopes.push({
      name: "Lifestyle",
      nameEs: "Estilo de vida",
      amount_type: "percentage",
      amount_value: goals.has("decrease_expenses") ? 20 : 30,
      classificationHints: ["discretionary"],
    });
    if (goals.has("save_more") || goals.has("build_emergency_fund") || goals.has("increase_wealth")) {
      seedEnvelopes.push({
        name: "Savings",
        nameEs: "Ahorro",
        amount_type: "percentage",
        amount_value: 20,
        classificationHints: ["savings"],
      });
    }
    if (goals.has("give_generously")) {
      // Only a share of income — never sized from expenses / fixed bills.
      seedEnvelopes.push({
        name: "Giving",
        nameEs: "Generosidad",
        amount_type: "percentage",
        amount_value: 10,
        classificationHints: ["giving"],
      });
    }
  }

  const homeCtas: PersonalizationPlan["homeCtas"] = [];
  if (goals.has("budget_tracking") || input.wantsBudgetHelp) {
    homeCtas.push("budget", "movements");
  }
  if (goals.has("increase_wealth")) homeCtas.push("wealth");
  if (goals.has("pay_debt") || input.hasDebts) homeCtas.push("liabilities", "wealth");
  if (goals.has("decrease_expenses")) homeCtas.push("insights", "budget");
  if (homeCtas.length === 0) homeCtas.push("movements", "budget");

  const attentionHints: PersonalizationPlan["attentionHints"] = [];
  if (goals.has("pay_debt") || input.hasDebts) attentionHints.push("pay_debt");
  if (goals.has("decrease_expenses")) attentionHints.push("decrease_expenses");

  return {
    methodId,
    seedEnvelopes,
    homeCtas: [...new Set(homeCtas)],
    attentionHints,
  };
}
