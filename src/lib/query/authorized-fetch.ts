import { createClient } from "@/lib/supabase/client";

/**
 * Fetch an API route with the current Supabase session's Bearer token.
 * Extracted from the identical pattern previously duplicated across hooks.
 * Throws on non-2xx responses so react-query can surface errors.
 */
export async function authorizedFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request to ${input} failed with status ${response.status}`);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
