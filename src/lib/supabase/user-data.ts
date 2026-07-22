import "server-only";

import type { AuthenticatedIdentity } from "@/lib/supabase/request";
import type { createRequestClient } from "@/lib/supabase/request";
import {
  createServiceRoleClient,
  resolveServiceRoleUserByEmail,
} from "@/lib/supabase/service-role";

type RequestSupabase = Awaited<
  ReturnType<typeof createRequestClient>
>["supabase"];

/**
 * User-facing traffic stays on the authenticated RLS client. The retired
 * cross-project bridge is available for one rollback window only and must be
 * enabled explicitly; the normal path never calls admin.listUsers.
 */
export async function resolveUserDataClient(input: {
  supabase: RequestSupabase;
  user: AuthenticatedIdentity;
}) {
  if (process.env.ENABLE_LEGACY_LEDGER_BRIDGE !== "true") {
    return {
      supabase: input.supabase,
      userId: input.user.id,
      legacyBridge: false,
    } as const;
  }

  const legacySupabase = createServiceRoleClient();
  const legacyUser = legacySupabase
    ? await resolveServiceRoleUserByEmail(input.user.email)
    : null;

  return {
    supabase: legacySupabase ?? input.supabase,
    userId: legacyUser?.id ?? input.user.id,
    legacyBridge: Boolean(legacySupabase && legacyUser),
  } as const;
}
