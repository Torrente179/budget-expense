/**
 * Prefetch adjacent month data into the browser HTTP cache.
 *
 * Uses low-priority fetch requests with `keepalive` so they don't block the
 * main thread or visible navigations. Aborts automatically if a new prefetch
 * is triggered before the previous one finishes (e.g., rapid month clicking).
 */

let _controller: AbortController | null = null;

function adjacentMonths(month: number, year: number) {
  const prev =
    month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const next =
    month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };
  return [prev, next];
}

function buildUrls(month: number, year: number): string[] {
  const params = `month=${month}&year=${year}`;
  return [
    `/api/expenses?${params}`,
    `/api/incomes?${params}`,
    `/api/dashboard/summary?${params}`,
  ];
}

export function prefetchAdjacentMonths(
  currentMonth: number,
  currentYear: number,
  accessToken?: string | null
) {
  // Cancel any in-flight prefetch
  _controller?.abort();
  _controller = new AbortController();
  const { signal } = _controller;

  const headers: HeadersInit = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  // Fire after a short idle to avoid competing with the current page's fetches
  const timer = setTimeout(() => {
    const months = adjacentMonths(currentMonth, currentYear);
    for (const { month, year } of months) {
      for (const url of buildUrls(month, year)) {
        fetch(url, {
          signal,
          credentials: "include",
          headers,
          // Use low priority so it doesn't compete with user-initiated fetches
          priority: "low" as RequestPriority,
        }).catch(() => {
          // Silently ignore — prefetch failures are never user-visible
        });
      }
    }
  }, 600);

  signal.addEventListener("abort", () => clearTimeout(timer));
}
