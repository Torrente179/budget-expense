"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * The user's giving target (% of income) from profiles.tithe_target_percent.
 * Falls back to the biblical 10% benchmark when unset or before the
 * 2026-07-03 migration is applied.
 */
export function useTitheTarget() {
  const { data } = useQuery({
    queryKey: ["tithe-target"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 10;
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("tithe_target_percent")
        .eq("id", user.id)
        .maybeSingle();
      if (error || profile?.tithe_target_percent == null) return 10;
      return Number(profile.tithe_target_percent);
    },
  });

  return data ?? 10;
}
