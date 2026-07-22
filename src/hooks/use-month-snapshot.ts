"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMonthSnapshot } from "@/lib/data";
import { queryKeys } from "@/lib/query/keys";

export function useMonthSnapshot(input: {
  month: number;
  year: number;
  asOfDate: string;
}) {
  const queryClient = useQueryClient();
  const handledRef = useRef<unknown>(null);
  const query = useQuery({
    queryKey: queryKeys.monthSnapshot(input.month, input.year, input.asOfDate),
    queryFn: ({ signal }) => getMonthSnapshot({ ...input, signal }),
  });

  useEffect(() => {
    if (
      !query.data ||
      query.data === handledRef.current ||
      query.data.recurringInsertedCount === 0
    ) {
      return;
    }
    handledRef.current = query.data;
    void queryClient.invalidateQueries({
      queryKey: ["expenses", input.year, input.month],
    });
    queryClient.setQueryData(
      queryKeys.monthSnapshot(input.month, input.year, input.asOfDate),
      { ...query.data, recurringInsertedCount: 0 }
    );
  }, [input.asOfDate, input.month, input.year, query.data, queryClient]);

  return query;
}
