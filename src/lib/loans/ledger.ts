import type { User } from "@supabase/supabase-js";
import { createRequestClient } from "@/lib/supabase/request";
import {
  createServiceRoleClient,
  resolveServiceRoleUserByEmail,
} from "@/lib/supabase/service-role";
import type { NextRequest } from "next/server";

type RequestClients = Awaited<ReturnType<typeof createRequestClient>>;

/** Resolve app RLS client + ledger client (same pattern as expenses/incomes). */
export async function resolveLedgerWriteClient(
  request: NextRequest
): Promise<{
  app: RequestClients;
  ledger: NonNullable<ReturnType<typeof createServiceRoleClient>> | RequestClients["supabase"];
  ledgerUserId: string;
  user: User;
} | null> {
  const app = await createRequestClient(request);
  if (!app.user) return null;

  const ledgerSupabase = createServiceRoleClient();
  const ledgerUser = ledgerSupabase
    ? await resolveServiceRoleUserByEmail(app.user.email)
    : null;
  const ledger = ledgerSupabase ?? app.supabase;
  const ledgerUserId = ledgerUser?.id ?? app.user.id;

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
