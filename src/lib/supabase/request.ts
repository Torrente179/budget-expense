import type { NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

async function createBearerClient(token: string) {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      "Missing Supabase environment variables on the server. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const supabase = createSupabaseClient<Database>(env.url, env.key, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return { supabase, user };
}

export async function createRequestClient(request: NextRequest): Promise<{
  supabase:
    | Awaited<ReturnType<typeof createServerClient>>
    | ReturnType<typeof createSupabaseClient<Database>>;
  user: User | null;
}> {
  const token = getBearerToken(request);

  if (token) {
    const bearerClient = await createBearerClient(token);
    if (bearerClient) {
      return bearerClient;
    }
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}
