"use client";

import type { ReactNode } from "react";
import type { BudgetKind } from "@/lib/budgeting/envelope-kinds";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { CategoryGlyph } from "@/components/shared/category-badge";
import { Check, Target, Trash2 } from "lucide-react";

export interface EnvelopeRow {
  id: string;
  name: string;
  kind: BudgetKind;
  target: number;
  progressAmount: number;
  ratio: number;
  /** Leading linked category. It gives each card a stable visual identity. */
  icon?: string;
  color?: string;
  categoryName?: string;
}

export interface EnvelopeCardProps {
  row: EnvelopeRow;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export interface EnvelopeListCardProps {
  kind: BudgetKind;
  rows: EnvelopeRow[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyAction?: ReactNode;
}

function CardActions({
  row,
  onDelete,
  onInk,
}: EnvelopeCardProps & { onInk: boolean }) {
  const { t } = useLocale();

  if (!onDelete) return null;

  return (
    <button
      type="button"
      aria-label={t(`Delete ${row.name}`, `Eliminar ${row.name}`)}
      onClick={() => onDelete(row.id)}
      className={
        onInk
          ? "absolute right-1 top-1 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-danger/15 hover:text-danger focus-visible:bg-danger/15 focus-visible:text-danger md:right-2 md:top-2 md:h-8 md:w-8"
          : "absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger-subtle hover:text-danger focus-visible:bg-danger-subtle focus-visible:text-danger md:right-2 md:h-8 md:w-8"
      }
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function TrackerContent({
  row,
  onEdit,
}: Pick<EnvelopeCardProps, "row" | "onEdit">) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();
  const remaining = row.target - row.progressAmount;
  const overBy = Math.max(-remaining, 0);
  const exceeded = row.progressAmount > row.target;
  const accent = exceeded ? "var(--danger)" : row.color || "var(--coral)";
  const fill = Number.isFinite(row.ratio)
    ? Math.min(Math.max(row.ratio, 0), 1) * 100
    : row.progressAmount > row.target
      ? 100
      : 0;
  const headline = exceeded
    ? t(
        `${formatCurrency(overBy, baseCurrency, intlLocale)} over`,
        `${formatCurrency(overBy, baseCurrency, intlLocale)} de más`
      )
    : t(
        `${formatCurrency(Math.max(remaining, 0), baseCurrency, intlLocale)} left`,
        `quedan ${formatCurrency(Math.max(remaining, 0), baseCurrency, intlLocale)}`
      );
  const content = (
    <>
      <div className="flex min-h-[8.25rem] flex-col px-3.5 pb-4 pt-3.5 sm:min-h-36 sm:px-4 sm:pb-4 sm:pt-4">
        <span className="mb-auto inline-flex" style={{ color: accent }} aria-hidden>
          {row.icon ? (
            <CategoryGlyph
              icon={row.icon}
              name={row.categoryName}
              className="h-5 w-5"
            />
          ) : (
            <Target className="h-5 w-5" strokeWidth={1.5} />
          )}
        </span>
        <div className="min-w-0 pt-4">
          <p className="truncate text-caption font-medium text-white/55">
            {row.name}
          </p>
          <p
            className="mt-0.5 text-heading font-bold leading-tight tracking-[-0.02em] text-white sm:text-xl"
            style={exceeded ? { color: accent } : undefined}
          >
            {headline}
          </p>
        </div>
      </div>
      <span className="block h-1 bg-white/8" aria-hidden>
        <span
          className="block h-full transition-[width] duration-[var(--motion-success)] ease-[var(--ease-out-up)] motion-reduce:transition-none"
          style={{ width: `${fill}%`, backgroundColor: accent }}
        />
      </span>
    </>
  );

  if (!onEdit) return content;

  return (
    <button
      type="button"
      className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-coral"
      aria-label={t(`Edit ${row.name}: ${headline}`, `Editar ${row.name}: ${headline}`)}
      onClick={() => onEdit(row.id)}
    >
      {content}
    </button>
  );
}

/**
 * The production Up-style Tracker card. Exported so the design harness can
 * render the exact component with fixture data.
 */
export function BudgetTrackerCard({
  row,
  onEdit,
  onDelete,
}: EnvelopeCardProps) {
  return (
    <article className="relative min-w-0 overflow-hidden rounded-xl bg-ink-2 text-white transition-transform duration-[var(--motion-standard)] active:scale-[0.985] motion-reduce:transform-none">
      <TrackerContent row={row} onEdit={onEdit} />
      <CardActions
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
        onInk
      />
    </article>
  );
}

function SaverContent({
  row,
  onEdit,
}: Pick<EnvelopeCardProps, "row" | "onEdit">) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();
  const hasTarget = row.target > 0;
  const complete = hasTarget && row.progressAmount >= row.target;
  const accent = complete ? "var(--success)" : row.color || "var(--coral)";
  const fill =
    hasTarget && Number.isFinite(row.ratio)
      ? Math.min(Math.max(row.ratio, 0), 1) * 100
      : 0;
  const progressLabel = formatCurrency(
    row.progressAmount,
    baseCurrency,
    intlLocale
  );
  const targetLabel = hasTarget
    ? formatCurrency(row.target, baseCurrency, intlLocale)
    : "—";
  const detail = complete
    ? t("Goal complete", "Meta completada")
    : hasTarget
      ? t(
          `${formatCurrency(Math.max(row.target - row.progressAmount, 0), baseCurrency, intlLocale)} to goal`,
          `faltan ${formatCurrency(Math.max(row.target - row.progressAmount, 0), baseCurrency, intlLocale)}`
        )
      : t(
          "Set monthly income to resolve this target",
          "Define el ingreso mensual para calcular esta meta"
        );

  const content = (
    <>
      <div className="flex min-h-[4.75rem] items-center gap-3 py-3 pl-4 pr-12">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="inline-flex" style={{ color: accent }} aria-hidden>
            {row.icon ? (
              <CategoryGlyph
                icon={row.icon}
                name={row.categoryName}
                className="h-5 w-5"
              />
            ) : (
              <Target className="h-5 w-5" strokeWidth={1.5} />
            )}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-body font-semibold text-foreground">
              <span className="truncate">{row.name}</span>
              {complete ? (
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-success"
                  aria-label={t("Complete", "Completada")}
                />
              ) : null}
            </p>
            <p
              className="mt-0.5 truncate text-caption"
              style={complete ? { color: accent } : undefined}
            >
              <span className={complete ? undefined : "text-muted-foreground"}>
                {detail}
              </span>
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-body font-bold leading-tight tabular-nums text-foreground">
            {progressLabel}
          </p>
          <p className="mt-0.5 font-mono text-label tabular-nums text-muted-foreground">
            {t(`of ${targetLabel}`, `de ${targetLabel}`)}
          </p>
        </div>
      </div>
      <span className="block h-1 bg-secondary" aria-hidden>
        <span
          className="block h-full transition-[width] duration-[var(--motion-success)] ease-[var(--ease-out-up)] motion-reduce:transition-none"
          style={{ width: `${fill}%`, backgroundColor: accent }}
        />
      </span>
    </>
  );

  if (!onEdit) return content;

  return (
    <button
      type="button"
      className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-coral"
      aria-label={t(`Edit ${row.name}`, `Editar ${row.name}`)}
      onClick={() => onEdit(row.id)}
    >
      {content}
    </button>
  );
}

/**
 * The production Up-style Saver/Meta card. Completion is deliberately
 * positive; unlike Trackers, reaching the target is success.
 */
export function BudgetSaverCard({ row, onEdit, onDelete }: EnvelopeCardProps) {
  return (
    <article className="relative min-w-0 overflow-hidden rounded-xl bg-card text-card-foreground transition-transform duration-[var(--motion-standard)] active:scale-[0.985] motion-reduce:transform-none">
      <SaverContent row={row} onEdit={onEdit} />
      <CardActions
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
        onInk={false}
      />
    </article>
  );
}

/** Exact production list used by the Budget screen and the design harness. */
export function EnvelopeListCard({
  kind,
  rows,
  onEdit,
  onDelete,
  emptyAction,
}: EnvelopeListCardProps) {
  const { t } = useLocale();
  const isGoal = kind === "contribution_goal";

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.025] px-4 py-6">
        <p className="max-w-lg text-body text-white/55">
          {isGoal
            ? t(
                "No savers yet. Create a target and track each contribution toward it.",
                "Aún no hay metas. Crea un objetivo y sigue cada aportación."
              )
            : t(
                "No trackers yet. Group categories under a monthly spending limit.",
                "Aún no hay presupuestos. Agrupa categorías bajo un límite mensual."
              )}
        </p>
        {emptyAction ? <div className="mt-4">{emptyAction}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={
        isGoal
          ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          : "grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4"
      }
      role="list"
    >
      {rows.map((row) => (
        <div key={row.id} className="min-w-0" role="listitem">
          {isGoal ? (
            <BudgetSaverCard
              row={row}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ) : (
            <BudgetTrackerCard
              row={row}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      ))}
    </div>
  );
}
