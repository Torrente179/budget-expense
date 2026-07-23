import type { AppLocale } from "@/lib/utils";

/** Fine-grained role used when seeding budgeting-method envelopes. */
export const BUDGET_ROLES = [
  "housing",
  "utilities",
  "groceries",
  "transport",
  "healthcare",
  "insurance",
  "taxes",
  "dining",
  "shopping",
  "subscriptions",
  "entertainment",
  "travel",
  "personal_care",
  "education",
  "professional",
  "cash",
  "other",
  "tithe",
  "donations",
  "savings",
  "investments",
  "loan_lent",
  "income",
  "debt_payment",
] as const;

export type BudgetRole = (typeof BUDGET_ROLES)[number];

const LABELS_EN: Record<BudgetRole, string> = {
  housing: "Housing",
  utilities: "Utilities",
  groceries: "Groceries",
  transport: "Transport",
  healthcare: "Healthcare",
  insurance: "Insurance",
  taxes: "Taxes",
  dining: "Dining out",
  shopping: "Shopping",
  subscriptions: "Subscriptions",
  entertainment: "Entertainment",
  travel: "Travel",
  personal_care: "Personal care",
  education: "Education",
  professional: "Professional services",
  cash: "Cash / ATM",
  other: "Other",
  tithe: "Tithe",
  donations: "Donations",
  savings: "Savings",
  investments: "Investments",
  loan_lent: "Loans lent",
  income: "Income",
  debt_payment: "Debt payments",
};

const LABELS_ES: Record<BudgetRole, string> = {
  housing: "Vivienda",
  utilities: "Servicios",
  groceries: "Supermercado",
  transport: "Transporte",
  healthcare: "Salud",
  insurance: "Seguros",
  taxes: "Impuestos",
  dining: "Restaurantes",
  shopping: "Compras",
  subscriptions: "Suscripciones",
  entertainment: "Entretenimiento",
  travel: "Viajes",
  personal_care: "Cuidado personal",
  education: "Educación",
  professional: "Servicios profesionales",
  cash: "Efectivo / cajero",
  other: "Otros",
  tithe: "Diezmo",
  donations: "Donaciones",
  savings: "Ahorro",
  investments: "Inversiones",
  loan_lent: "Préstamos dados",
  income: "Ingreso",
  debt_payment: "Pago de deudas",
};

export function budgetRoleLabel(role: BudgetRole, locale: AppLocale): string {
  return locale === "es" ? LABELS_ES[role] : LABELS_EN[role];
}

export function budgetRoleOptions(locale: AppLocale): Array<{
  value: BudgetRole;
  label: string;
}> {
  return BUDGET_ROLES.map((value) => ({
    value,
    label: budgetRoleLabel(value, locale),
  }));
}

export function isBudgetRole(value: string | null | undefined): value is BudgetRole {
  return Boolean(value && (BUDGET_ROLES as readonly string[]).includes(value));
}
