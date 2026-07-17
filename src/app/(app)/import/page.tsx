"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Screen } from "@/components/patterns/screen";
import { ImportDropzone } from "@/components/import/import-dropzone";
import { ImportHistory } from "@/components/import/import-history";
import { ImportReview } from "@/components/import/import-review";
import {
  useImportBatch,
  useImportBatches,
} from "@/hooks/use-import-batches";
import type { ImportSourceFormat } from "@/lib/import/types";
import { useLocale } from "@/providers/locale-provider";

export default function ImportPage() {
  const { t } = useLocale();
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  const {
    batches,
    loading,
    createBatch,
    commitBatch,
    rollbackBatch,
    discardBatch,
  } = useImportBatches();
  const { batch, updateRows } = useImportBatch(activeBatchId);

  async function handleUpload(input: {
    format: ImportSourceFormat;
    filename: string;
    content: string;
  }) {
    try {
      const result = await createBatch.mutateAsync(input);
      setActiveBatchId(result.batch.id);
      if (result.titheCount > 0) {
        toast.success(
          t(
            `${result.titheCount} tithe transfer(s) detected`,
            `${result.titheCount} transferencia(s) de diezmo detectada(s)`
          )
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("Could not analyze the CSV", "No se pudo analizar el CSV")
      );
    }
  }

  async function handleCommit() {
    if (!activeBatchId) return;
    try {
      const result = await commitBatch.mutateAsync(activeBatchId);
      toast.success(
        t(
          `Imported ${result.insertedExpenses} expenses and ${result.insertedIncomes} incomes`,
          `Importados ${result.insertedExpenses} gastos y ${result.insertedIncomes} ingresos`
        )
      );
      setActiveBatchId(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("Import failed", "La importación falló")
      );
    }
  }

  async function handleDiscard() {
    if (!activeBatchId) return;
    try {
      await discardBatch.mutateAsync(activeBatchId);
      setActiveBatchId(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("Could not discard", "No se pudo descartar")
      );
    }
  }

  async function handleRollback(id: string) {
    setRollingBackId(id);
    try {
      const result = await rollbackBatch.mutateAsync(id);
      toast.success(
        t(
          `Removed ${result.removedExpenses + result.removedIncomes} imported movements`,
          `Eliminados ${result.removedExpenses + result.removedIncomes} movimientos importados`
        )
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("Rollback failed", "La reversión falló")
      );
    } finally {
      setRollingBackId(null);
    }
  }

  return (
    <Screen
      title={t("Import", "Importar")}
      eyebrow={t("Bank CSV", "CSV bancario")}
      backHref="/home"
    >

      <ImportDropzone
        onUpload={handleUpload}
        uploading={createBatch.isPending}
      />

      {batch && (
        <ImportReview
          batch={batch}
          onOverride={(overrides) => updateRows.mutateAsync(overrides)}
          onCommit={handleCommit}
          onDiscard={handleDiscard}
          committing={commitBatch.isPending}
        />
      )}

      <ImportHistory
        batches={batches}
        loading={loading}
        onSelect={setActiveBatchId}
        onRollback={handleRollback}
        rollingBackId={rollingBackId}
      />
    </Screen>
  );
}
