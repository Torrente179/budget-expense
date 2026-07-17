import type { AppLocale } from "@/lib/utils";

export const PRIMARY_GOALS = [
  "save_more",
  "increase_wealth",
  "budget_tracking",
  "decrease_expenses",
  "pay_debt",
  "give_generously",
  "build_emergency_fund",
] as const;

export type PrimaryGoal = (typeof PRIMARY_GOALS)[number];

export function isPrimaryGoal(value: string): value is PrimaryGoal {
  return (PRIMARY_GOALS as readonly string[]).includes(value);
}

export function goalLabel(goal: PrimaryGoal, locale: AppLocale): string {
  const labels: Record<PrimaryGoal, { en: string; es: string }> = {
    save_more: { en: "Save more", es: "Ahorrar más" },
    increase_wealth: { en: "Increase wealth", es: "Aumentar patrimonio" },
    budget_tracking: { en: "Track my budget", es: "Seguir mi presupuesto" },
    decrease_expenses: { en: "Decrease expenses", es: "Reducir gastos" },
    pay_debt: { en: "Pay off debt", es: "Pagar deudas" },
    give_generously: { en: "Give generously", es: "Dar con generosidad" },
    build_emergency_fund: {
      en: "Build an emergency fund",
      es: "Crear fondo de emergencia",
    },
  };
  return labels[goal][locale];
}
