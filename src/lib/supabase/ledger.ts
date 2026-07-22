import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createRequestClient } from "@/lib/supabase/request";
import { resolveUserDataClient } from "@/lib/supabase/user-data";
import type { Database } from "@/types/database";

export interface LedgerContext {
  /** Authenticated RLS client; legacy bridge only when explicitly enabled. */
  supabase: SupabaseClient<Database>;
  /** Ledger-project user id when resolved, else the app user id. */
  userId: string;
  /** The requesting app user (auth project). */
  appUserId: string;
}

/**
 * Compatibility context for routes that have not moved to direct browser RLS
 * access yet. Normal traffic stays in the single Supabase project.
 */
export async function resolveLedgerContext(
  request: NextRequest
): Promise<LedgerContext | null> {
  const { supabase: appSupabase, user } = await createRequestClient(request);
  if (!user) return null;

  const data = await resolveUserDataClient({ supabase: appSupabase, user });

  return {
    supabase: data.supabase as SupabaseClient<Database>,
    userId: data.userId,
    appUserId: user.id,
  };
}
