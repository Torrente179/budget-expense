import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createRequestClient } from "@/lib/supabase/request";
import {
  createServiceRoleClient,
  resolveServiceRoleUserByEmail,
} from "@/lib/supabase/service-role";
import type { Database } from "@/types/database";

export interface LedgerContext {
  /** Service-role ledger client when configured, else the app client. */
  supabase: SupabaseClient<Database>;
  /** Ledger-project user id when resolved, else the app user id. */
  userId: string;
  /** The requesting app user (auth project). */
  appUserId: string;
}

/**
 * The canonical auth + ledger-fallback resolution used by /api/expenses:
 * authenticate against the app project, then prefer the service-role ledger
 * client with the user resolved by email.
 */
export async function resolveLedgerContext(
  request: NextRequest
): Promise<LedgerContext | null> {
  const { supabase: appSupabase, user } = await createRequestClient(request);
  if (!user) return null;

  const ledgerSupabase = createServiceRoleClient();
  const ledgerUser = ledgerSupabase
    ? await resolveServiceRoleUserByEmail(user.email)
    : null;

  return {
    supabase: (ledgerSupabase ?? appSupabase) as SupabaseClient<Database>,
    userId: ledgerUser?.id ?? user.id,
    appUserId: user.id,
  };
}
