import { QueryClient } from "@tanstack/react-query";

/**
 * Shared QueryClient factory. staleTime keeps month navigation instant while
 * mutations invalidate their domains explicitly; the browser HTTP cache on
 * transactional GETs was removed in favor of this client cache so refetches
 * after mutations always see fresh data.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** Singleton on the browser; fresh instance per render on the server. */
export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
