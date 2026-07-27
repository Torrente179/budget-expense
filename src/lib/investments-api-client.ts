import { createClient } from "@/lib/supabase/client";
import type {
  BrokerageAccountRow,
  InvestmentAssetRow,
  InvestmentCashMovementWithJoins,
  InvestmentSavingsAccountRow,
  InvestmentSavingsTransferWithJoins,
  InvestmentTradeWithJoins,
  InvestmentWatchlistWithJoins,
} from "@/lib/investments";

export interface InvestmentSnapshot {
  accounts: BrokerageAccountRow[];
  assets: InvestmentAssetRow[];
  trades: InvestmentTradeWithJoins[];
  cashMovements: InvestmentCashMovementWithJoins[];
  savingsAccounts: InvestmentSavingsAccountRow[];
  savingsTransfers: InvestmentSavingsTransferWithJoins[];
  watchlist: InvestmentWatchlistWithJoins[];
}

export interface InvestmentOverviewResource {
  accounts: BrokerageAccountRow[];
  assets: InvestmentAssetRow[];
  positionTrades: InvestmentTradeWithJoins[];
  cashLedger: InvestmentCashMovementWithJoins[];
  watchlist: InvestmentWatchlistWithJoins[];
}

export interface InvestmentPage<T> {
  items: T[];
  page: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface InvestmentSavingsPage {
  accounts: InvestmentSavingsAccountRow[];
  transfers: InvestmentSavingsTransferWithJoins[];
  balanceTotals: Array<{
    accountId: string;
    currency: string;
    amount: number;
  }>;
  page: InvestmentPage<unknown>["page"];
}

async function getAuthHeaders() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token
    ? {
        Authorization: `Bearer ${session.access_token}`,
      }
    : undefined;
}

async function parseError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

async function fetchInvestmentResource<T>(
  resource: string,
  options: { offset?: number; limit?: number; signal?: AbortSignal } = {}
) {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ resource });
  if (options.offset !== undefined) params.set("offset", String(options.offset));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  const response = await fetch(`/api/investments?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers,
    signal: options.signal,
  });
  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        `Investment ${resource} fetch failed with status ${response.status}`
      )
    );
  }
  return (await response.json()) as T;
}

export function fetchInvestmentOverview(signal?: AbortSignal) {
  return fetchInvestmentResource<InvestmentOverviewResource>("overview", {
    signal,
  });
}

export function fetchInvestmentTradesPage(
  offset: number,
  signal?: AbortSignal
) {
  return fetchInvestmentResource<InvestmentPage<InvestmentTradeWithJoins>>(
    "trades",
    { offset, limit: 75, signal }
  );
}

export function fetchInvestmentCashPage(
  offset: number,
  signal?: AbortSignal
) {
  return fetchInvestmentResource<
    InvestmentPage<InvestmentCashMovementWithJoins>
  >("cash", { offset, limit: 75, signal });
}

export function fetchInvestmentSavingsPage(
  offset: number,
  signal?: AbortSignal
) {
  return fetchInvestmentResource<InvestmentSavingsPage>("savings", {
    offset,
    limit: 75,
    signal,
  });
}

export async function fetchInvestmentWatchlist(signal?: AbortSignal) {
  const result = await fetchInvestmentResource<{
    items: InvestmentWatchlistWithJoins[];
  }>("watchlist", { signal });
  return result.items;
}

export async function fetchInvestmentSnapshot(signal?: AbortSignal) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/investments", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers,
    signal,
  });

  if (!response.ok) {
    throw new Error(
      await parseError(response, `Investment fetch failed with status ${response.status}`)
    );
  }

  return (await response.json()) as InvestmentSnapshot;
}

export async function requestInvestmentMutation(
  method: "POST" | "PATCH" | "DELETE",
  body: unknown
) {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/investments", {
    method,
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      await parseError(
        response,
        `Investment mutation failed with status ${response.status}`
      )
    );
  }

  // Creates return `{ ok, id }` so a caller can chain (the savings wizard
  // records an opening movement against the fund it just made).
  const text = await response.text();
  return text ? (JSON.parse(text) as { ok?: boolean; id?: string | null }) : null;
}
