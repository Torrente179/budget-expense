/**
 * Net worth — the Patrimonio balance sheet.
 *
 * Patrimonio answers "what do I own, what do I owe, what am I worth today".
 * Presupuesto answers "what came in, what went out, what can I spend this
 * month". The same euro must never be counted in both, which is why the two
 * headline figures here are deliberately separate:
 *
 *   netWorth       = everything owned − everything owed
 *   availableMoney = only what can actually be spent today
 *
 * Moving €300 from checking to savings changes neither total assets nor net
 * worth — it is a transfer. It does reduce available money when the savings
 * fund is excluded from availability. See `transaction-effects.ts` for the
 * full event table.
 *
 * Everything in this module is pure and already-converted: callers convert to
 * the base currency first (conversion only exists client-side, through
 * `CurrencyProvider.convert`). That keeps this testable and keeps React out.
 */

export interface WealthComponents {
  /** Checking, cash, wallets — `wealth_accounts`, whatever their availability. */
  accountsAndCash: number;
  /** Savings funds — `investment_savings_*` balances. */
  savings: number;
  /** Portfolio market value plus uninvested broker cash. */
  investments: number;
  /** Receivables: what other people still owe you. */
  moneyLent: number;
  /** Outstanding debt — the only liability class today. */
  debts: number;
}

export interface NetWorthTotals extends WealthComponents {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  /** 0..1 shares of the assets-vs-debts donut; 0 when there is nothing yet. */
  assetsShare: number;
  liabilitiesShare: number;
}

export const EMPTY_COMPONENTS: WealthComponents = {
  accountsAndCash: 0,
  savings: 0,
  investments: 0,
  moneyLent: 0,
  debts: 0,
};

export function computeNetWorth(c: WealthComponents): NetWorthTotals {
  const totalAssets =
    c.accountsAndCash + c.savings + c.investments + c.moneyLent;
  const totalLiabilities = c.debts;
  const gross = totalAssets + totalLiabilities;

  return {
    ...c,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    assetsShare: gross > 0 ? totalAssets / gross : 0,
    liabilitiesShare: gross > 0 ? totalLiabilities / gross : 0,
  };
}

/**
 * Spendable money — NOT net worth. Investments, receivables and reserved
 * savings belong to the user but cannot necessarily be spent today, so a
 * €9.950 net worth can sit alongside €2.500 of available money.
 */
export function computeAvailableMoney(input: {
  accounts: { balance: number; includeInAvailable: boolean }[];
  /** Savings funds explicitly flagged as available. */
  savingsAvailable?: number;
  /** Money already earmarked by the monthly plan. */
  reserved?: number;
}): number {
  const liquid = input.accounts.reduce(
    (sum, account) => (account.includeInAvailable ? sum + account.balance : sum),
    0
  );
  return liquid + (input.savingsAvailable ?? 0) - (input.reserved ?? 0);
}

export interface MonthlyChange {
  amount: number | null;
  /** null when there is no prior snapshot or it was zero — never Infinity. */
  percentage: number | null;
}

export const NO_MONTHLY_CHANGE: MonthlyChange = {
  amount: null,
  percentage: null,
};

/**
 * Change against the previous month's closing net worth. With no prior
 * snapshot both fields stay null so the hero renders nothing rather than a
 * fabricated `+0,00 €`.
 */
export function computeMonthlyChange(
  current: number,
  previousMonthClosing: number | null
): MonthlyChange {
  if (previousMonthClosing === null || !Number.isFinite(previousMonthClosing)) {
    return NO_MONTHLY_CHANGE;
  }

  const amount = current - previousMonthClosing;
  const base = Math.abs(previousMonthClosing);

  return { amount, percentage: base > 0 ? amount / base : null };
}

export interface NetWorthSnapshotPoint {
  /** yyyy-MM-dd */
  asOfDate: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

/**
 * The previous month's closing net worth: the latest snapshot dated on or
 * before the last day of last month.
 *
 * It is deliberately not "the row dated exactly the 31st". Snapshots are
 * written when the user opens the app, so demanding an exact month-end row
 * would show no change at all for anyone who skipped that day.
 */
export function resolvePreviousMonthClosing(
  snapshots: NetWorthSnapshotPoint[],
  today: string
): number | null {
  const lastDayOfPreviousMonth = previousMonthEnd(today);
  if (!lastDayOfPreviousMonth) return null;

  let best: NetWorthSnapshotPoint | null = null;
  for (const point of snapshots) {
    if (point.asOfDate > lastDayOfPreviousMonth) continue;
    if (!best || point.asOfDate > best.asOfDate) best = point;
  }

  return best ? best.netWorth : null;
}

/** yyyy-MM-dd of the last day of the month before `today`. */
export function previousMonthEnd(today: string): string | null {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(today);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  // Day 0 of this month is the last day of the previous one.
  const date = new Date(Date.UTC(year, month - 1, 0));

  return date.toISOString().slice(0, 10);
}

export type TrendRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

export const TREND_RANGE_MONTHS: Record<TrendRange, number | null> = {
  "1M": 1,
  "3M": 3,
  "6M": 6,
  "1Y": 12,
  ALL: null,
};

/** Sorted, range-filtered series for the Evolución chart. */
export function resolveTrendSeries(input: {
  snapshots: NetWorthSnapshotPoint[];
  range: TrendRange;
  today: string;
}): NetWorthSnapshotPoint[] {
  const sorted = [...input.snapshots].sort((a, b) =>
    a.asOfDate.localeCompare(b.asOfDate)
  );

  const months = TREND_RANGE_MONTHS[input.range];
  if (months === null) return sorted;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.today);
  if (!match) return sorted;

  const cutoff = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1 - months, Number(match[3]))
  )
    .toISOString()
    .slice(0, 10);

  return sorted.filter((point) => point.asOfDate >= cutoff);
}

export type CushionTone = "critical" | "building" | "good" | "strong";

export interface Cushion {
  /** Months of essential spending covered; null without essential data. */
  months: number | null;
  /** Progress toward the target, clamped 0..1, for the meter. */
  ratio: number | null;
  tone: CushionTone;
  targetMonths: number;
}

export const DEFAULT_CUSHION_TARGET_MONTHS = 6;

/**
 * Colchón financiero. Only genuinely liquid money earmarked for emergencies
 * counts — investments, receivables and credit limits do not, because none of
 * them is reliably there on the day the boiler breaks.
 */
export function computeCushion(input: {
  liquidEmergencySavings: number;
  averageMonthlyEssentialExpenses: number | null;
  targetMonths?: number;
}): Cushion {
  const targetMonths = input.targetMonths ?? DEFAULT_CUSHION_TARGET_MONTHS;
  const essentials = input.averageMonthlyEssentialExpenses;

  if (!essentials || essentials <= 0 || !Number.isFinite(essentials)) {
    return { months: null, ratio: null, tone: "critical", targetMonths };
  }

  const months = Math.max(input.liquidEmergencySavings, 0) / essentials;

  return {
    months,
    ratio: Math.min(months / targetMonths, 1),
    tone: resolveCushionTone(months),
    targetMonths,
  };
}

export function resolveCushionTone(months: number): CushionTone {
  if (months >= 6) return "strong";
  if (months >= 3) return "good";
  if (months >= 1) return "building";
  return "critical";
}

export const CUSHION_LABELS: Record<CushionTone, { en: string; es: string }> = {
  critical: { en: "At risk", es: "En riesgo" },
  building: { en: "Building", es: "En construcción" },
  good: { en: "Good", es: "Bueno" },
  strong: { en: "Strong", es: "Sólido" },
};

/* ------------------------------------------------------------------ *
 * Row reducers — how each raw table becomes one converted number.
 * ------------------------------------------------------------------ */

type Convert = (amount: number, currency: string) => number;

/** Balance of one account: opening balance plus its signed movements. */
export function accountBalance(
  account: { opening_balance: number | string; currency: string },
  movements: { amount: number | string }[]
): number {
  return movements.reduce(
    (sum, movement) => sum + Number(movement.amount),
    Number(account.opening_balance)
  );
}

export function sumAccountsBase(
  accounts: {
    id: string;
    opening_balance: number | string;
    currency: string;
    status: string;
  }[],
  movements: { account_id: string; amount: number | string }[],
  convert: Convert
): number {
  return accounts
    .filter((account) => account.status === "active")
    .reduce((sum, account) => {
      const own = movements.filter(
        (movement) => movement.account_id === account.id
      );
      return sum + convert(accountBalance(account, own), account.currency);
    }, 0);
}

/**
 * Outstanding receivables: `principal − Σ repayments`, floored at zero so an
 * overpayment never reads as a negative asset.
 */
export function sumLoansOutstandingBase(
  loans: {
    id: string;
    principal: number | string;
    currency: string;
    is_active: boolean;
  }[],
  repayments: { loan_id: string; amount: number | string }[],
  convert: Convert
): number {
  return loans
    .filter((loan) => loan.is_active)
    .reduce((sum, loan) => {
      const repaid = repayments
        .filter((repayment) => repayment.loan_id === loan.id)
        .reduce((paid, repayment) => paid + Number(repayment.amount), 0);
      const outstanding = Math.max(Number(loan.principal) - repaid, 0);
      return sum + convert(outstanding, loan.currency);
    }, 0);
}
