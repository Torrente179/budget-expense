import {
  createRequestClient,
  type AuthenticatedIdentity,
} from "@/lib/supabase/request";
import { resolveUserDataClient } from "@/lib/supabase/user-data";
import type { NextRequest } from "next/server";

type RequestClients = Awaited<ReturnType<typeof createRequestClient>>;

/** Resolve app RLS client + ledger client (same pattern as expenses/incomes). */
export async function resolveLedgerWriteClient(
  request: NextRequest,
  authenticatedApp?: RequestClients
): Promise<{
  app: RequestClients;
  ledger: RequestClients["supabase"];
  ledgerUserId: string;
  user: AuthenticatedIdentity;
} | null> {
  const app = authenticatedApp ?? (await createRequestClient(request));
  if (!app.user) return null;

  const { supabase: ledger, userId: ledgerUserId } =
    await resolveUserDataClient({ supabase: app.supabase, user: app.user });

  return { app, ledger, ledgerUserId, user: app.user };
}

/** Prefer global Loan category; fall back to any matching name. */
export async function resolveLoanCategoryId(
  supabase: RequestClients["supabase"]
): Promise<string | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, user_id")
    .ilike("name", "loan");

  if (error || !data?.length) return null;

  const normalized = data.filter(
    (row) => row.name.trim().toLowerCase() === "loan"
  );
  const global = normalized.find((row) => row.user_id === null);
  return (global ?? normalized[0])?.id ?? null;
}
