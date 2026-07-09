/**
 * Interpretable spending anomalies: a category's current-month total more
 * than 2 standard deviations above its trailing mean. Categories with fewer
 * than 3 months of history are suppressed (not enough signal to alarm on).
 */

export interface CategoryMonthTotal {
  month: string; // YYYY-MM
  categoryId: string;
  categoryName: string;
  /** Already converted to base currency */
  total: number;
}

export interface SpendingAnomaly {
  categoryId: string;
  categoryName: string;
  currentTotal: number;
  historicalMean: number;
  /** How many trailing months informed the mean */
  monthsOfHistory: number;
}

const MIN_HISTORY_MONTHS = 3;
const SIGMA_THRESHOLD = 2;

export function detectAnomalies(
  totals: CategoryMonthTotal[],
  currentMonth: string
): SpendingAnomaly[] {
  const byCategory = new Map<
    string,
    { name: string; history: number[]; current: number }
  >();

  for (const row of totals) {
    const entry = byCategory.get(row.categoryId) ?? {
      name: row.categoryName,
      history: [],
      current: 0,
    };
    if (row.month === currentMonth) {
      entry.current += row.total;
    } else {
      entry.history.push(row.total);
    }
    byCategory.set(row.categoryId, entry);
  }

  const anomalies: SpendingAnomaly[] = [];
  for (const [categoryId, entry] of byCategory) {
    if (entry.history.length < MIN_HISTORY_MONTHS || entry.current <= 0) {
      continue;
    }
    const mean =
      entry.history.reduce((sum, value) => sum + value, 0) /
      entry.history.length;
    const variance =
      entry.history.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      entry.history.length;
    const stdDev = Math.sqrt(variance);

    if (entry.current > mean + SIGMA_THRESHOLD * stdDev && entry.current > mean * 1.2) {
      anomalies.push({
        categoryId,
        categoryName: entry.name,
        currentTotal: entry.current,
        historicalMean: mean,
        monthsOfHistory: entry.history.length,
      });
    }
  }

  return anomalies.sort(
    (a, b) => b.currentTotal - b.historicalMean - (a.currentTotal - a.historicalMean)
  );
}
