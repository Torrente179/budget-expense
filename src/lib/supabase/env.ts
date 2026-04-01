const SUPABASE_URL_CANDIDATES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
] as const;

const SUPABASE_KEY_CANDIDATES = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
] as const;

function readFirstDefined(names: readonly string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = readFirstDefined(SUPABASE_URL_CANDIDATES);
  const key = readFirstDefined(SUPABASE_KEY_CANDIDATES);

  if (!url || !key) {
    return null;
  }

  return { url, key };
}
