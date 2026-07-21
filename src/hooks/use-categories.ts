"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query/keys";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Prefer a single row per display name. Global / default rows win over
 * user-scoped copies so pickers never show "Taxes" twice.
 */
function dedupeCategories(rows: Category[]): Category[] {
  const byName = new Map<string, Category>();
  for (const row of rows) {
    const key = normalizeName(row.name);
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, row);
      continue;
    }
    const preferIncoming =
      (existing.user_id !== null && row.user_id === null) ||
      (existing.user_id !== null &&
        row.user_id !== null &&
        Boolean(row.is_default) &&
        !existing.is_default) ||
      (existing.user_id === row.user_id &&
        new Date(row.created_at).getTime() <
          new Date(existing.created_at).getTime());
    if (preferIncoming) byName.set(key, row);
  }
  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

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
      return dedupeCategories(rows ?? []);
    },
  });

  return { categories: data ?? [], loading: isPending };
}
