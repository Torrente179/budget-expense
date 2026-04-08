"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { prefetchAdjacentMonths } from "@/lib/prefetch";

/**
 * After the current month finishes loading, prefetch data for adjacent months
 * so prev/next navigation feels instant.
 */
export function usePrefetchMonths(month: number, year: number, loading: boolean) {
  const supabase = createClient();

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        prefetchAdjacentMonths(month, year, session?.access_token);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [month, year, loading, supabase]);
}
