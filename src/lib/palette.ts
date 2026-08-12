/**
 * App color palette — switch `ACTIVE_PALETTE` to revert to OG values.
 *
 * CSS mirrors the active cashflow tokens in `globals.css`
 * (`--income`, `--available`, `--expense`). Budget usage bands are
 * consumed from this module so rings stay in sync with one flip.
 */

export type PaletteId = "hybrid" | "v2" | "og";

/** Flip to `"v2"` to restore full-chroma categories, `"og"` for the originals. */
export const ACTIVE_PALETTE: PaletteId = "hybrid";

export type BudgetUsageTone =
  | "safe"
  | "watch"
  | "near"
  | "exceeded"
  | "critical";

export interface BudgetUsageBand {
  tone: BudgetUsageTone;
  /** Inclusive lower bound as a ratio (0.85 = 85%). */
  minRatio: number;
  labelEn: string;
  labelEs: string;
  hex: string;
}

interface CashflowColors {
  income: string;
  available: string;
  expense: string;
}

interface CategoryColorMap {
  housing: string;
  titheCharity: string;
  restaurants: string;
  groceries: string;
  travel: string;
  services: string;
  shopping: string;
  health: string;
  subscriptions: string;
  other: string;
  income: string;
  expenses: string;
  /** Unlisted defaults kept for continuity. */
  transportation: string;
  entertainment: string;
  education: string;
  loan: string;
}

/**
 * Patrimonio category accents (Cuentas · Ahorros · Inversiones · Dinero
 * prestado · Deudas). Reused palette values rather than new hues, so the
 * balance sheet reads in the same language as the rest of the app.
 */
interface WealthColorMap {
  accounts: string;
  savings: string;
  investments: string;
  lent: string;
  debts: string;
}

interface Palette {
  id: PaletteId;
  cashflow: CashflowColors;
  budgetUsage: Record<BudgetUsageTone, string>;
  categories: CategoryColorMap;
  wealth: WealthColorMap;
}

/** Previous product colors (pre–Jul 2026 palette pass). */
export const PALETTE_OG: Palette = {
  id: "og",
  cashflow: {
    income: "#0e8a63",
    available: "#171b24",
    expense: "#b13a58",
  },
  budgetUsage: {
    safe: "#0e8a63",
    watch: "#d49412",
    near: "#d49412",
    exceeded: "#b13a58",
    critical: "#b13a58",
  },
  categories: {
    housing: "#eab308",
    titheCharity: "#d97706",
    restaurants: "#ef4444",
    groceries: "#22c55e",
    travel: "#14b8a6",
    services: "#84cc16",
    shopping: "#8b5cf6",
    health: "#ec4899",
    subscriptions: "#f43f5e",
    other: "#64748b",
    income: "#15803d",
    expenses: "#b13a58",
    transportation: "#f97316",
    entertainment: "#06b6d4",
    education: "#6366f1",
    loan: "#0f766e",
  },
  wealth: {
    accounts: "#171b24",
    savings: "#0e8a63",
    investments: "#6366f1",
    lent: "#d49412",
    debts: "#b13a58",
  },
};

/** Jul 2026 clarity palette. */
export const PALETTE_V2: Palette = {
  id: "v2",
  cashflow: {
    income: "#059669",
    available: "#06B6D4",
    expense: "#E11D48",
  },
  budgetUsage: {
    safe: "#22C55E",
    watch: "#F59E0B",
    near: "#F97316",
    exceeded: "#EF4444",
    critical: "#BE123C",
  },
  categories: {
    housing: "#EAB308",
    titheCharity: "#14B8A6",
    restaurants: "#F43F5E",
    groceries: "#22C55E",
    travel: "#06B6D4",
    services: "#84CC16",
    shopping: "#8B5CF6",
    health: "#EC4899",
    subscriptions: "#F97316",
    other: "#64748B",
    income: "#059669",
    expenses: "#E11D48",
    transportation: "#F97316",
    entertainment: "#06B6D4",
    education: "#6366F1",
    loan: "#0f766e",
  },
  wealth: {
    accounts: "#06B6D4",
    savings: "#059669",
    investments: "#6366F1",
    lent: "#F59E0B",
    debts: "#E11D48",
  },
};

/**
 * Hybrid — v2 semantics with the category hues pulled toward steel.
 *
 * Cashflow, usage bands and wealth accents are unchanged: those carry
 * meaning and must not move for aesthetic reasons. Only `categories`
 * drops chroma, so the donut and the ledger marks read as one material
 * instead of seven unrelated picker choices.
 */
export const PALETTE_HYBRID: Palette = {
  ...PALETTE_V2,
  id: "hybrid",
  categories: {
    housing: "#C9A227",
    titheCharity: "#3E8FA0",
    restaurants: "#B5545F",
    groceries: "#5E8C57",
    travel: "#3E8FA0",
    services: "#7E8C4E",
    shopping: "#8B6FB0",
    health: "#C0784A",
    subscriptions: "#6068A8",
    other: "#7C838C",
    income: "#059669",
    expenses: "#B5545F",
    transportation: "#4A7FB5",
    entertainment: "#8B6FB0",
    education: "#6068A8",
    loan: "#3E7A70",
  },
};

export const PALETTE: Palette = (
  {
    og: PALETTE_OG,
    v2: PALETTE_V2,
    hybrid: PALETTE_HYBRID,
  } as const satisfies Record<PaletteId, Palette>
)[ACTIVE_PALETTE];

/** Ordered bands for legends / docs (highest threshold first for resolve). */
export const BUDGET_USAGE_BANDS: BudgetUsageBand[] = [
  {
    tone: "critical",
    minRatio: 1.2,
    labelEn: "Critical",
    labelEs: "Crítico",
    hex: PALETTE.budgetUsage.critical,
  },
  {
    tone: "exceeded",
    minRatio: 1,
    labelEn: "Exceeded",
    labelEs: "Excedido",
    hex: PALETTE.budgetUsage.exceeded,
  },
  {
    tone: "near",
    minRatio: 0.85,
    labelEn: "Near limit",
    labelEs: "Casi al límite",
    hex: PALETTE.budgetUsage.near,
  },
  {
    tone: "watch",
    minRatio: 0.7,
    labelEn: "Watch",
    labelEs: "Atento",
    hex: PALETTE.budgetUsage.watch,
  },
  {
    tone: "safe",
    minRatio: 0,
    labelEn: "Safe",
    labelEs: "Bien",
    hex: PALETTE.budgetUsage.safe,
  },
];

/** Map spent/limit ratio → usage tone (not month-pace). */
export function resolveBudgetUsageTone(ratio: number): BudgetUsageTone {
  if (!Number.isFinite(ratio) || ratio >= 1.2) return "critical";
  if (ratio >= 1) return "exceeded";
  if (ratio >= 0.85) return "near";
  if (ratio >= 0.7) return "watch";
  return "safe";
}

export function budgetUsageColor(tone: BudgetUsageTone): string {
  return PALETTE.budgetUsage[tone];
}

export function budgetUsageColorForRatio(ratio: number): string {
  return budgetUsageColor(resolveBudgetUsageTone(ratio));
}

export type WealthCategory = keyof WealthColorMap;

/**
 * Accent per Patrimonio category. Import these instead of writing raw
 * Tailwind status colors — `design.md` gate 1 bans those in `src/`.
 */
export const WEALTH_ACCENTS: Record<WealthCategory, string> = PALETTE.wealth;

export function wealthAccent(category: WealthCategory): string {
  return PALETTE.wealth[category];
}
