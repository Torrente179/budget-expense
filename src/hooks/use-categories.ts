"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query/keys";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export function useCategories() {
  const { data, isPending } = useQuery({
    queryKey: queryKeys.categories,
    // Categories change rarely — keep them fresh for the whole session
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Category[]> => {
      const supabase = createClient();
      const { data: rows, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return rows ?? [];
    },
  });

  return { categories: data ?? [], loading: isPending };
}
