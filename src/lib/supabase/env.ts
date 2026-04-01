function normalize(value: string | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getPublicEnv() {
  const url = normalize(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key =
    normalize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    normalize(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

function getServerOnlyEnv() {
  const url = normalize(process.env.SUPABASE_URL);
  const key =
    normalize(process.env.SUPABASE_ANON_KEY) ??
    normalize(process.env.SUPABASE_PUBLISHABLE_KEY);

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function getSupabaseEnv(): { url: string; key: string } | null {
  // In client bundles, environment variables must be referenced directly.
  // Dynamic lookups (e.g. process.env[name]) are not reliably available.
  const publicEnv = getPublicEnv();
  if (publicEnv) {
    return publicEnv;
  }

  if (typeof window === "undefined") {
    return getServerOnlyEnv();
  }

  return null;
}
