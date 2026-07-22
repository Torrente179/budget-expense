import type { NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export interface AuthenticatedIdentity {
  id: string;
  email: string | null;
}

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

  const verificationClient = createSupabaseClient<Database>(env.url, env.key, {
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

  const { data, error } = await verificationClient.auth.getClaims(token);

  if (error || !data?.claims.sub) {
    return { supabase: verificationClient, user: null };
  }

  const supabase = createSupabaseClient<Database>(env.url, env.key, {
    accessToken: async () => token,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return {
    supabase,
    user: {
      id: data.claims.sub,
      email: typeof data.claims.email === "string" ? data.claims.email : null,
    } satisfies AuthenticatedIdentity,
  };
}

export async function createRequestClient(request: NextRequest): Promise<{
  supabase:
    | Awaited<ReturnType<typeof createServerClient>>
    | ReturnType<typeof createSupabaseClient<Database>>;
  user: AuthenticatedIdentity | null;
}> {
  const token = getBearerToken(request);

  if (token) {
    return createBearerClient(token);
  }

  const supabase = await createServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const user = claims?.sub
    ? ({
        id: claims.sub,
        email: typeof claims.email === "string" ? claims.email : null,
      } satisfies AuthenticatedIdentity)
    : null;

  return { supabase, user };
}
