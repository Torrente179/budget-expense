import type { ProposedRow } from "./types";

/**
 * Port of assign_tithe_from_wise_transfers() in
 * scripts/generate_santander_import.py (lines 523-663).
 *
 * Primary heuristic: match each paycheck-sized income (≥ €500) to an
 * unmatched Wise transfer expense within 5 days whose amount is within 25%
 * of 10% of that income. Fallback per month with Wise transfers but no
 * paycheck match: the transfer closest to 10% of the month's total income.
 *
 * Mutates matched rows to the tithe category and returns the count.
 */

const TITHE_MATCH_TOLERANCE = 0.25;
const SIGNIFICANT_INCOME_THRESHOLD = 500;
const TITHE_LOOKAHEAD_DAYS = 5;

function dayDelta(fromIso: string, toIso: string): number {
  return Math.round(
    (Date.parse(toIso) - Date.parse(fromIso)) / (24 * 60 * 60 * 1000)
  );
}

function findMatchingWiseTransfer(
  rows: ProposedRow[],
  candidateIndices: number[],
  targetAmount: number,
  incomeDate: string
): number | null {
  const matches: { difference: number; delta: number; date: string; index: number }[] =
    [];

  for (const index of candidateIndices) {
    const row = rows[index];
    const delta = dayDelta(incomeDate, row.date);
    if (delta < 0 || delta > TITHE_LOOKAHEAD_DAYS) continue;

    const difference = Math.abs(row.amount - targetAmount);
    if (targetAmount <= 0 || difference / targetAmount > TITHE_MATCH_TOLERANCE) {
      continue;
    }

    matches.push({ difference, delta, date: row.date, index });
  }

  if (matches.length === 0) return null;

  matches.sort(
    (a, b) =>
      a.difference - b.difference ||
      a.delta - b.delta ||
      a.date.localeCompare(b.date) ||
      a.index - b.index
  );
  return matches[0].index;
}

export function assignTithes(
  rows: ProposedRow[],
  titheCategoryId: string,
  titheCategoryName: string
): number {
  const incomeByMonth = new Map<string, number>();
  for (const row of rows) {
    if (row.rowType !== "income") continue;
    const month = row.date.slice(0, 7);
    incomeByMonth.set(month, (incomeByMonth.get(month) ?? 0) + row.amount);
  }

  const wiseIndicesByMonth = new Map<string, number[]>();
  rows.forEach((row, index) => {
    if (
      row.rowType === "expense" &&
      row.description.toLowerCase().includes("wise")
    ) {
      const month = row.date.slice(0, 7);
      const list = wiseIndicesByMonth.get(month) ?? [];
      list.push(index);
      wiseIndicesByMonth.set(month, list);
    }
  });

  let titheCount = 0;
  const matchedIndices = new Set<number>();
  const matchedMonths = new Set<string>();

  const relabel = (index: number) => {
    rows[index].categoryId = titheCategoryId;
    rows[index].categoryName = titheCategoryName;
    rows[index].categorySource = "tithe";
    rows[index].needsReview = false;
    matchedIndices.add(index);
    titheCount++;
  };

  const significantIncomes = rows.filter(
    (row) =>
      row.rowType === "income" && row.amount >= SIGNIFICANT_INCOME_THRESHOLD
  );

  for (const income of significantIncomes) {
    const month = income.date.slice(0, 7);
    const candidates = (wiseIndicesByMonth.get(month) ?? []).filter(
      (index) => !matchedIndices.has(index)
    );
    if (candidates.length === 0) continue;

    const matched = findMatchingWiseTransfer(
      rows,
      candidates,
      income.amount * 0.1,
      income.date
    );
    if (matched === null) continue;

    relabel(matched);
    matchedMonths.add(month);
  }

  for (const [month, indices] of wiseIndicesByMonth) {
    if (matchedMonths.has(month)) continue;

    const monthlyIncome = incomeByMonth.get(month) ?? 0;
    if (monthlyIncome <= 0) continue;

    const available = indices.filter((index) => !matchedIndices.has(index));
    if (available.length === 0) continue;

    const titheTarget = monthlyIncome * 0.1;
    let bestIndex = available[0];
    for (const index of available) {
      if (
        Math.abs(rows[index].amount - titheTarget) <
        Math.abs(rows[bestIndex].amount - titheTarget)
      ) {
        bestIndex = index;
      }
    }

    const bestDiff = Math.abs(rows[bestIndex].amount - titheTarget);
    if (titheTarget > 0 && bestDiff / titheTarget <= TITHE_MATCH_TOLERANCE) {
      relabel(bestIndex);
    }
  }

  return titheCount;
}
