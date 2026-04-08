import { NextResponse } from "next/server";

/**
 * Wraps NextResponse.json with short-lived cache headers.
 *
 * - `private`: ensures CDNs/proxies don't cache user-specific data
 * - `max-age=30`: the browser can use the cached response for 30 seconds
 *   without any network request at all (instant prev/next month)
 * - `stale-while-revalidate=120`: for 2 minutes after max-age expires, the
 *   browser serves the stale response immediately while revalidating in the
 *   background (feels instant, data updates within seconds)
 */
export function cachedJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set(
    "Cache-Control",
    "private, max-age=30, stale-while-revalidate=120"
  );
  return response;
}
