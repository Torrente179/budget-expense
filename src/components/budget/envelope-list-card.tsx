"use client";

import {
  contributionGoalBarColor,
  contributionGoalStatusLabel,
  resolveContributionGoalStatus,
  resolveSpendingLimitStatus,
  spendingLimitBarColor,
  spendingLimitStatusLabel,
  type BudgetKind,
} from "@/lib/budgeting/envelope-kinds";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { Pencil, Trash2 } from "lucide-react";

export interface EnvelopeRow {
  id: string;
  name: string;
  kind: BudgetKind;
  target: number;
  progressAmount: number;
  ratio: number;
}

interface EnvelopeListCardProps {
  kind: BudgetKind;
  rows: EnvelopeRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  emptyAction?: React.ReactNode;
}

export function EnvelopeListCard({
  kind,
  rows,
  onEdit,
  onDelete,
  emptyAction,
}: EnvelopeListCardProps) {
  const { t, locale, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();
  const isGoal = kind === "contribution_goal";

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <div className="space-y-3 py-2">
          <p className="text-body text-muted-foreground">
            {isGoal
              ? t(
                  "No contribution goals yet. Add tithe, savings, or investing targets.",
                  "Aún sin metas de aportación. Añade diezmo, ahorro o inversión."
                )
              : t(
                  "No spending limits yet. Group categories under a ceiling.",
                  "Aún sin límites de gasto. Agrupa categorías bajo un techo."
                )}
          </p>
          {emptyAction}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const remaining = row.target - row.progressAmount;
            const overBy = Math.max(row.progressAmount - row.target, 0);
            if (isGoal) {
              const status = resolveContributionGoalStatus(
                row.progressAmount,
                row.target
              );
              const color = contributionGoalBarColor(status);
              const label = contributionGoalStatusLabel(
                status,
                row.ratio,
                locale
              );
              return (
                <EnvelopeRowView
                  key={row.id}
                  name={row.name}
                  amountLine={`${formatCurrency(row.progressAmount, baseCurrency, intlLocale)} / ${formatCurrency(row.target, baseCurrency, intlLocale)}`}
                  statusLabel={label}
                  statusColor={color}
                  ratio={Math.min(Math.max(row.ratio, 0), 1)}
                  barColor={color}
                  onEdit={() => onEdit(row.id)}
                  onDelete={() => onDelete(row.id)}
                  deleteLabel={t("Delete goal", "Eliminar meta")}
                />
              );
            }

            const status = resolveSpendingLimitStatus(row.ratio);
            const color = spendingLimitBarColor(status);
            const statusLabel = spendingLimitStatusLabel(status, locale);
            const detail =
              overBy > 0
                ? t(
                    `${formatCurrency(overBy, baseCurrency, intlLocale)} over`,
                    `${formatCurrency(overBy, baseCurrency, intlLocale)} excedidos`
                  )
                : t(
                    `${formatCurrency(Math.max(remaining, 0), baseCurrency, intlLocale)} left`,
                    `${formatCurrency(Math.max(remaining, 0), baseCurrency, intlLocale)} restantes`
                  );

            return (
              <EnvelopeRowView
                key={row.id}
                name={row.name}
                amountLine={`${formatCurrency(row.progressAmount, baseCurrency, intlLocale)} / ${formatCurrency(row.target, baseCurrency, intlLocale)}`}
                statusLabel={statusLabel}
                statusColor={color}
                detail={detail}
                badge={
                  overBy > 0
                    ? t(
                        `${formatCurrency(overBy, baseCurrency, intlLocale)} over`,
                        `${formatCurrency(overBy, baseCurrency, intlLocale)} excedidos`
                      )
                    : undefined
                }
                ratio={row.ratio}
                barColor={color}
                percentLabel={`${Math.round(Math.min(row.ratio, 9.99) * 100)}%`}
                onEdit={() => onEdit(row.id)}
                onDelete={() => onDelete(row.id)}
                deleteLabel={t("Delete limit", "Eliminar límite")}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function EnvelopeRowView({
  name,
  amountLine,
  statusLabel,
  statusColor,
  detail,
  badge,
  ratio,
  barColor,
  percentLabel,
  onEdit,
  onDelete,
  deleteLabel,
}: {
  name: string;
  amountLine: string;
  statusLabel: string;
  statusColor: string;
  detail?: string;
  badge?: string;
  ratio: number;
  barColor: string;
  percentLabel?: string;
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  return (
    <div className="rounded-xl bg-secondary/40 px-3 py-3 ring-1 ring-border/50">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-body font-medium">{name}</p>
              <p className="mt-0.5 font-mono text-caption tabular-nums text-muted-foreground">
                {amountLine}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className="font-mono text-caption font-semibold tabular-nums"
                style={{ color: statusColor }}
              >
                {percentLabel ?? statusLabel}
              </p>
              {detail && (
                <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                  {detail}
                </p>
              )}
            </div>
          </div>
          {badge && (
            <span
              className="mt-2 inline-flex rounded-md px-2 py-0.5 text-[0.6875rem] font-medium"
              style={{
                color: statusColor,
                backgroundColor: `${statusColor}18`,
              }}
            >
              {badge}
            </span>
          )}
          {!percentLabel && (
            <p
              className="mt-1 text-[0.6875rem] font-medium"
              style={{ color: statusColor }}
            >
              {statusLabel}
            </p>
          )}
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) * 100 : 100}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
          </div>
        </button>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            aria-label="Edit"
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={deleteLabel}
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-subtle hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
