"use client";

import { useQuery } from "@tanstack/react-query";
import { getAppBootstrap } from "@/lib/data";
import { queryKeys } from "@/lib/query/keys";

export function useAppBootstrap() {
  return useQuery({
    queryKey: queryKeys.appBootstrap,
    queryFn: ({ signal }) => getAppBootstrap(signal),
    staleTime: 60 * 60 * 1000,
  });
}
