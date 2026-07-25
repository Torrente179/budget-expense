"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, CopyX, Loader2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UnderlineTabs } from "@/components/patterns/underline-tabs";
import { CategoryIcon, CategoryOption, CATEGORY_SELECT_CONTENT_CLASS } from "@/components/shared/category-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { useCategories } from "@/hooks/use-categories";
import type {
  ImportBatchDetail,
  RowOverride,
} from "@/hooks/use-import-batches";
import type { ProposedRow } from "@/lib/import/types";
import { useLocale } from "@/providers/locale-provider";

type Filter = "all" | "new" | "duplicate" | "uncategorized";

interface ImportReviewProps {
  batch: ImportBatchDetail;
  onOverride: (overrides: RowOverride[]) => Promise<unknown>;
  onCommit: () => Promise<unknown>;
  onDiscard: () => Promise<unknown>;
  committing: boolean;
}

export function ImportReview({
  batch,
  onOverride,
  onCommit,
  onDiscard,
  committing,
}: ImportReviewProps) {
  const { t } = useLocale();
  const { categories } = useCategories();
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () =>
      [...batch.rows].sort(
        (a, b) => b.date.localeCompare(a.date) || a.index - b.index
      ),
    [batch.rows]
  );

  const visibleRows =
    filter === "all" ? rows : rows.filter((row) => row.status === filter);

  const includedCount = rows.filter(
    (row) => row.include && (row.rowType === "income" || row.categoryId)
  ).length;

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const isPending = batch.status === "pending";

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: t("All", "Todos"), count: rows.length },
    { id: "new", label: t("New", "Nuevos"), count: batch.new_count },
    {
      id: "duplicate",
      label: t("Duplicates", "Duplicados"),
      count: batch.duplicate_count,
    },
    {
      id: "uncategorized",
      label: t("Needs category", "Sin categoría"),
      count: batch.uncategorized_count,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {batch.filename ?? t("Imported file", "Archivo importado")}
        </CardTitle>
        <CardDescription>
          {isPending
            ? t(
                "Review the proposal — nothing is saved yet.",
                "Revisa la propuesta — aún no se guarda nada."
              )
            : t("This batch is read-only.", "Este lote es de solo lectura.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <UnderlineTabs
          tabs={filters.map((item) => ({
            key: item.id,
            label: `${item.label} · ${item.count}`,
          }))}
          value={filter}
          onChange={(value) => setFilter(value as Filter)}
          ariaLabel={t("Filter rows", "Filtrar filas")}
        />

        {visibleRows.length === 0 ? (
          <EmptyState
            icon={CopyX}
            title={t("Nothing here", "Nada por aquí")}
            description={t(
              "No rows match this filter.",
              "Ningún movimiento coincide con este filtro."
            )}
          />
        ) : (
          <ul className="space-y-2">
            {visibleRows.map((row) => (
              <ReviewRow
                key={row.index}
                row={row}
                category={
                  row.categoryId
                    ? (categoryById.get(row.categoryId) ?? null)
                    : null
                }
                categories={categories}
                editable={isPending}
                onOverride={onOverride}
              />
            ))}
          </ul>
        )}

        {isPending && (
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t(
                `${includedCount} movement${includedCount !== 1 ? "s" : ""} will be imported`,
                `Se importará${includedCount !== 1 ? "n" : ""} ${includedCount} movimiento${includedCount !== 1 ? "s" : ""}`
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void onDiscard()}>
                <Undo2 />
                {t("Discard", "Descartar")}
              </Button>
              <Button
                onClick={() => void onCommit()}
                disabled={committing || includedCount === 0}
              >
                {committing ? <Loader2 className="animate-spin" /> : <Check />}
                {t(`Import ${includedCount}`, `Importar ${includedCount}`)}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ReviewRowProps {
  row: ProposedRow;
  category: { id: string; name: string; icon: string; color: string } | null;
  categories: { id: string; name: string; icon: string; color: string }[];
  editable: boolean;
  onOverride: (overrides: RowOverride[]) => Promise<unknown>;
}

function ReviewRow({
  row,
  category,
  categories,
  editable,
  onOverride,
}: ReviewRowProps) {
  const { t, tc } = useLocale();
  const isIncome = row.rowType === "income";

  return (
    <li
      className={`flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-border ${
        row.include ? "bg-card" : "bg-muted/40 opacity-70"
      }`}
    >
      {!isIncome && category ? (
        <CategoryIcon
          icon={category.icon}
          color={category.color}
          className="shrink-0"
        />
      ) : (
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            isIncome ? "bg-success-subtle" : "bg-secondary"
          }`}
        >
          {isIncome ? (
            <ArrowDownRight className="h-4 w-4 text-success" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.description}</p>
        <p className="text-xs text-muted-foreground">
          {row.date}
          {row.status === "duplicate" && (
            <>
              {" · "}
              <span className="text-destructive">
                {t("possible duplicate", "posible duplicado")}
              </span>
            </>
          )}
          {row.categorySource === "tithe" && (
            <>
              {" · "}
              <span className="text-success">
                {t("tithe detected", "diezmo detectado")}
              </span>
            </>
          )}
        </p>
      </div>

      {!isIncome && (
        <div className="w-44">
          {editable ? (
            <Select
              value={row.categoryId ?? ""}
              onValueChange={(value) => {
                const selected = categories.find((c) => c.id === value);
                void onOverride([
                  {
                    index: row.index,
                    categoryId: value || null,
                    categoryName: selected?.name ?? null,
                    // A manual correction is worth remembering as a rule
                    rememberRule: true,
                  },
                ]);
              }}
            >
              <SelectTrigger
                className="h-8 border-border/80 bg-secondary/40 text-xs"
                aria-invalid={!row.categoryId}
              >
                <SelectValue
                  placeholder={t("Choose category", "Elige categoría")}
                >
                  {category ? (
                    <CategoryOption
                      name={tc(category.name)}
                      icon={category.icon}
                      color={category.color}
                    />
                  ) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className={CATEGORY_SELECT_CONTENT_CLASS}>
                {categories.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="text-sm">
                    <CategoryOption
                      name={tc(item.name)}
                      icon={item.icon}
                      color={item.color}
                    />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="truncate text-xs text-muted-foreground">
              {category?.name ?? t("Uncategorized", "Sin categoría")}
            </p>
          )}
        </div>
      )}

      <CurrencyDisplay
        amount={isIncome ? row.amount : -row.amount}
        currency={row.currency}
        tone={isIncome ? "positive" : "default"}
      />

      {editable && (
        <Switch
          checked={row.include}
          aria-label={t("Include in import", "Incluir en la importación")}
          onCheckedChange={(checked) =>
            void onOverride([{ index: row.index, include: checked }])
          }
        />
      )}
    </li>
  );
}
