"use client";

import { History, Loader2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import type { ImportBatchSummary } from "@/hooks/use-import-batches";
import { useLocale } from "@/providers/locale-provider";

interface ImportHistoryProps {
  batches: ImportBatchSummary[];
  loading: boolean;
  onSelect: (id: string) => void;
  onRollback: (id: string) => Promise<unknown>;
  rollingBackId: string | null;
}

export function ImportHistory({
  batches,
  loading,
  onSelect,
  onRollback,
  rollingBackId,
}: ImportHistoryProps) {
  const { t } = useLocale();

  const statusLabel: Record<ImportBatchSummary["status"], string> = {
    pending: t("Pending review", "Pendiente de revisión"),
    committed: t("Imported", "Importado"),
    rolled_back: t("Rolled back", "Revertido"),
    discarded: t("Discarded", "Descartado"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Import history", "Historial de importaciones")}</CardTitle>
        <CardDescription>
          {t(
            "Every batch can be rolled back without touching manual entries.",
            "Cada lote puede revertirse sin tocar los registros manuales."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : batches.length === 0 ? (
          <EmptyState
            icon={History}
            title={t("No imports yet", "Aún no hay importaciones")}
            description={t(
              "Upload your first bank CSV above.",
              "Sube tu primer CSV bancario arriba."
            )}
          />
        ) : (
          <ul className="space-y-2">
            {batches.map((batch) => (
              <li
                key={batch.id}
                className="flex flex-wrap items-center gap-3 rounded-lg bg-card px-3 py-2.5 ring-1 ring-border"
              >
                <button
                  type="button"
                  onClick={() => onSelect(batch.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-medium">
                    {batch.filename ?? t("Bank CSV", "CSV bancario")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(batch.created_at).toLocaleDateString()} ·{" "}
                    {t(
                      `${batch.new_count} new · ${batch.duplicate_count} duplicates`,
                      `${batch.new_count} nuevos · ${batch.duplicate_count} duplicados`
                    )}
                  </p>
                </button>
                <Badge
                  variant={
                    batch.status === "committed"
                      ? "secondary"
                      : batch.status === "pending"
                        ? "default"
                        : "outline"
                  }
                >
                  {statusLabel[batch.status]}
                </Badge>
                {batch.status === "committed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={rollingBackId === batch.id}
                    onClick={() => void onRollback(batch.id)}
                  >
                    {rollingBackId === batch.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <RotateCcw />
                    )}
                    {t("Roll back", "Revertir")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
