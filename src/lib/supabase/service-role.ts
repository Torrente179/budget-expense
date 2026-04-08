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

// Singleton service-role client — reuse across requests in the same process
let _serviceRoleClient: ReturnType<typeof createClient<Database>> | null = null;
let _serviceRoleEnvSnapshot: { url: string; key: string } | null = null;

export function createServiceRoleClient() {
  const env = getServiceRoleEnv();

  if (!env) {
    return null;
  }

  // Reuse existing client if env hasn't changed
  if (
    _serviceRoleClient &&
    _serviceRoleEnvSnapshot?.url === env.url &&
    _serviceRoleEnvSnapshot?.key === env.key
  ) {
    return _serviceRoleClient;
  }

  _serviceRoleClient = createClient<Database>(env.url, env.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  _serviceRoleEnvSnapshot = env;
  return _serviceRoleClient;
}

// In-memory cache for resolved ledger users (email → User)
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const _userCache = new Map<string, { user: User; expiresAt: number }>();

export async function resolveServiceRoleUserByEmail(
  email: string | null | undefined
): Promise<User | null> {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  // Check cache first
  const cached = _userCache.get(normalizedEmail);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.user;
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

  const found =
    data.users.find(
      (candidate) => candidate.email?.trim().toLowerCase() === normalizedEmail
    ) ?? null;

  // Cache the result (including null → we store only hits)
  if (found) {
    _userCache.set(normalizedEmail, {
      user: found,
      expiresAt: Date.now() + USER_CACHE_TTL,
    });
  }

  return found;
}
