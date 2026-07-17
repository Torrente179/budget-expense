import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/signup") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/api")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/signup"))
  ) {
    const url = request.nextUrl.clone();
    // Prefer onboarding for brand-new profiles; client gate also enforces this.
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at, onboarding_skipped_at, created_at")
      .eq("id", user.id)
      .maybeSingle();

    // Only brand-new accounts (profile created on/after feature launch) get
    // the onboarding redirect. Pre-existing users go straight to Home.
    const ONBOARDING_FEATURE_LAUNCH = "2026-07-18T00:00:00.000Z";
    const isNewAccount =
      !profile?.created_at ||
      new Date(profile.created_at).getTime() >=
        new Date(ONBOARDING_FEATURE_LAUNCH).getTime();
    const onboarded =
      Boolean(profile?.onboarding_completed_at) ||
      Boolean(profile?.onboarding_skipped_at) ||
      !isNewAccount;
    url.pathname = onboarded ? "/home" : "/onboarding";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
