/**
 * Monthly plan pace math shared by Home and Budget.
 *
 * remaining = income − outflows
 * usedRatio = outflows / income
 * daily = remaining / days left (excludes today; floors at 1 day)
 *
 * Home separately prefers the tracked cash balance for its headline so cash
 * left at month-end carries into the next month. Budget keeps using the
 * month-only plan figures below.
 *
 * Money helpers round via integer cents for stable % / remaining.
 */

export type MonthPaceStatus =
  | "over_plan"
  | "on_track"
  | "slightly_ahead"
  | "high_pace"
  | "unavailable";

export interface MonthCashflowInput {
  /** Plan income when set, else recorded income. Null/≤0 → unavailable. */
  monthlyIncome: number | null;
  /** Actual expense outflows for the month (base currency). */
  actualOutflows: number;
  daysInMonth: number;
  /** 1-based day of month; for past months pass daysInMonth. */
  currentDay: number;
  isCurrentMonth: boolean;
}

export interface MonthCashflow {
  monthlyIncome: number | null;
  actualOutflows: number;
  remaining: number | null;
  usedRatio: number | null;
  monthProgress: number;
  daysRemaining: number;
  dailyAvailable: number | null;
  paceStatus: MonthPaceStatus;
}

export interface HomeAvailableBalance {
  amount: number | null;
  dailyAvailable: number | null;
  source: "tracked" | "monthly_cashflow" | "unavailable";
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function resolveMonthCashflow(input: MonthCashflowInput): MonthCashflow {
  const daysInMonth = Math.max(input.daysInMonth, 1);
  const currentDay = Math.min(
    Math.max(input.currentDay, 1),
    daysInMonth
  );
  const monthProgress = input.isCurrentMonth
    ? currentDay / daysInMonth
    : 1;
  const daysRemaining = Math.max(daysInMonth - currentDay, 1);

  const income =
    input.monthlyIncome != null && input.monthlyIncome > 0
      ? input.monthlyIncome
      : null;
  const outflows = Math.max(input.actualOutflows, 0);

  if (income == null) {
    return {
      monthlyIncome: null,
      actualOutflows: outflows,
      remaining: null,
      usedRatio: null,
      monthProgress,
      daysRemaining,
      dailyAvailable: null,
      paceStatus: "unavailable",
    };
  }

  const incomeCents = toCents(income);
  const outflowCents = toCents(outflows);
  const remainingCents = incomeCents - outflowCents;
  const remaining = fromCents(remainingCents);
  const usedRatio = incomeCents > 0 ? outflowCents / incomeCents : null;
  const dailyAvailable = fromCents(
    Math.max(remainingCents, 0) / daysRemaining
  );

  let paceStatus: MonthPaceStatus;
  if (remainingCents < 0) {
    paceStatus = "over_plan";
  } else if (usedRatio == null) {
    paceStatus = "unavailable";
  } else if (usedRatio <= monthProgress) {
    paceStatus = "on_track";
  } else if (usedRatio <= monthProgress + 0.05) {
    paceStatus = "slightly_ahead";
  } else {
    paceStatus = "high_pace";
  }

  return {
    monthlyIncome: income,
    actualOutflows: outflows,
    remaining,
    usedRatio,
    monthProgress,
    daysRemaining,
    dailyAvailable,
    paceStatus,
  };
}

/**
 * Resolve the Home headline without changing the monthly budget engine.
 *
 * A tracked balance is a real cash position anchored by the latest checkpoint
 * and adjusted by every later movement, so it naturally crosses month
 * boundaries. Until tracking is configured, Home falls back to the existing
 * month-only income-minus-outflows figure.
 */
export function resolveHomeAvailableBalance({
  trackedBalance,
  monthlyRemaining,
  daysRemaining,
}: {
  trackedBalance: number | null;
  monthlyRemaining: number | null;
  daysRemaining: number;
}): HomeAvailableBalance {
  const hasTrackedBalance =
    trackedBalance != null && Number.isFinite(trackedBalance);
  const hasMonthlyRemaining =
    monthlyRemaining != null && Number.isFinite(monthlyRemaining);

  const source = hasTrackedBalance
    ? "tracked"
    : hasMonthlyRemaining
      ? "monthly_cashflow"
      : "unavailable";
  const amount = hasTrackedBalance
    ? fromCents(toCents(trackedBalance))
    : hasMonthlyRemaining
      ? fromCents(toCents(monthlyRemaining))
      : null;

  if (amount == null) {
    return { amount: null, dailyAvailable: null, source };
  }

  const divisor = Math.max(Math.floor(daysRemaining), 1);
  const dailyAvailable = fromCents(
    Math.max(toCents(amount), 0) / divisor
  );

  return { amount, dailyAvailable, source };
}

export function formatUsagePercent(ratio: number | null): string {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  return String(Math.round(Math.min(Math.max(ratio, 0), 9.99) * 100));
}
