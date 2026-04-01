import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "@/lib/supabase/env";

let missingEnvWarned = false;

export function createClient() {
  const env = getSupabaseEnv();

  if (!env) {
    if (!missingEnvWarned) {
      missingEnvWarned = true;
      console.warn(
        "Supabase environment variables not found. Auth and data features are disabled."
      );
    }
    // Return a client with placeholder values — it won't connect,
    // but it won't crash the app either. Auth checks will fail gracefully.
    return createBrowserClient<Database>(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }

  return createBrowserClient<Database>(env.url, env.key);
}
