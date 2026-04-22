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

export async function fetchInvestmentSnapshot() {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/investments", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers,
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
}
