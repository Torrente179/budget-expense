import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function normalize(value: string | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getServiceRoleEnv() {
  const url = normalize(process.env.SUPABASE_URL);
  const key = normalize(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function createServiceRoleClient() {
  const env = getServiceRoleEnv();

  if (!env) {
    return null;
  }

  return createClient<Database>(env.url, env.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function resolveServiceRoleUserByEmail(
  email: string | null | undefined
): Promise<User | null> {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    throw error;
  }

  return (
    data.users.find(
      (candidate) => candidate.email?.trim().toLowerCase() === normalizedEmail
    ) ?? null
  );
}
