"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import type { ImportSourceFormat, ProposedRow } from "@/lib/import/types";

export interface ImportBatchSummary {
  id: string;
  source_format: ImportSourceFormat;
  filename: string | null;
  status: "pending" | "committed" | "rolled_back" | "discarded";
  new_count: number;
  duplicate_count: number;
  uncategorized_count: number;
  created_at: string;
  committed_at: string | null;
}

export interface ImportBatchDetail extends ImportBatchSummary {
  rows: ProposedRow[];
}

export interface RowOverride {
  index: number;
  categoryId?: string | null;
  categoryName?: string | null;
  include?: boolean;
  rememberRule?: boolean;
}

const batchesKey = ["import-batches"] as const;
const batchKey = (id: string) => ["import-batches", id] as const;

export function useImportBatches() {
  const queryClient = useQueryClient();

  const { data, isPending, refetch } = useQuery({
    queryKey: batchesKey,
    queryFn: async () => {
      const result = await authorizedFetch<{ batches: ImportBatchSummary[] }>(
        "/api/import/batches"
      );
      return result.batches;
    },
  });

  const invalidateLedger = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: batchesKey }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.incomesAll }),
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummaryAll }),
    ]);
  };

  const createBatch = useMutation({
    mutationFn: async (input: {
      format: ImportSourceFormat;
      filename?: string;
      content: string;
    }) =>
      authorizedFetch<{
        batch: ImportBatchSummary;
        skipped: { noComputable: number; unknownKind: number };
        titheCount: number;
      }>("/api/import/batches", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: batchesKey }),
  });

  const commitBatch = useMutation({
    mutationFn: async (id: string) =>
      authorizedFetch<{
        ok: boolean;
        insertedExpenses: number;
        insertedIncomes: number;
        skippedDuplicates: number;
        skippedUncategorized: number;
      }>(`/api/import/batches/${id}/commit`, { method: "POST" }),
    onSuccess: invalidateLedger,
  });

  const rollbackBatch = useMutation({
    mutationFn: async (id: string) =>
      authorizedFetch<{ ok: boolean; removedExpenses: number; removedIncomes: number }>(
        `/api/import/batches/${id}/rollback`,
        { method: "POST" }
      ),
    onSuccess: invalidateLedger,
  });

  const discardBatch = useMutation({
    mutationFn: async (id: string) =>
      authorizedFetch<{ ok: boolean }>(`/api/import/batches/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: batchesKey }),
  });

  return {
    batches: data ?? [],
    loading: isPending,
    refetch,
    createBatch,
    commitBatch,
    rollbackBatch,
    discardBatch,
  };
}

export function useImportBatch(id: string | null) {
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: batchKey(id ?? "none"),
    enabled: Boolean(id),
    queryFn: async () => {
      const result = await authorizedFetch<{ batch: ImportBatchDetail }>(
        `/api/import/batches/${id}`
      );
      return result.batch;
    },
  });

  const updateRows = useMutation({
    mutationFn: async (overrides: RowOverride[]) =>
      authorizedFetch<{ batch: ImportBatchDetail }>(
        `/api/import/batches/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ rows: overrides }),
        }
      ),
    onSuccess: (result) => {
      queryClient.setQueryData(batchKey(id ?? "none"), result.batch);
      void queryClient.invalidateQueries({ queryKey: batchesKey });
    },
  });

  return { batch: data ?? null, loading: isPending, updateRows };
}
