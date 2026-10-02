"use client";

import { useId, useState } from "react";
import { Target, Trash2 } from "lucide-react";
import type { BudgetKind } from "@/lib/budgeting/envelope-kinds";
import { cn, formatCurrencyTrim } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { CategoryGlyph } from "@/components/shared/category-badge";

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

interface TrackerWalletProps {
  rows: EnvelopeRow[];
  /** Days left in the month, for the open card's footnote. Omit past months. */
  daysRemaining?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/** Over-limit cards take one fixed red, whatever their category colour. */
const OVER_LIMIT = "#c0342b";

/**
 * Card fill for a tracker: the category colour mixed about half with black, so white
 * text stays readable on every category hue. No colour falls back to the
 * raised surface.
 */
function walletColor(row: EnvelopeRow, exceeded: boolean): string | undefined {
  if (exceeded) return OVER_LIMIT;
  return row.color ? `color-mix(in srgb, ${row.color} 54%, #000)` : undefined;
}

/**
 * Trackers as a wallet: one coloured card per spending limit, stacked so each
 * card's top strip stays visible. The strip is **remaining-first** — what is
 * left (`€124 left`) or, past the limit, what it is over by (`€38 over`), with
 * a thin bar for the proportion and never a bare percentage. One card is open
 * at a time and shows the spent-of-limit detail and its actions.
 */
export function TrackerWallet({
  rows,
  daysRemaining,
  onEdit,
  onDelete,
}: TrackerWalletProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();
  const baseId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /* The last card is the only one never covered, so it opens by default. */
  const openId =
    selectedId && rows.some((row) => row.id === selectedId)
      ? selectedId
      : rows[rows.length - 1]?.id;

  return (
    <div role="list" className="flex flex-col">
      {rows.map((row, index) => {
        const remaining = row.target - row.progressAmount;
        const exceeded = row.progressAmount > row.target;
        const fill = Number.isFinite(row.ratio)
          ? Math.min(Math.max(row.ratio, 0), 1) * 100
          : exceeded
            ? 100
            : 0;
        const money = (value: number) =>
          formatCurrencyTrim(value, baseCurrency, intlLocale);
        const amount = money(Math.abs(remaining));
        const headline = exceeded
          ? t(`${amount} over`, `${amount} de más`)
          : t(`${amount} left`, `quedan ${amount}`);
        const open = row.id === openId;
        const last = index === rows.length - 1;
        const panelId = `${baseId}-${row.id}`;

        return (
          <div
            key={row.id}
            role="listitem"
            className={cn(
              "wallet-card relative overflow-hidden rounded-3xl",
              index > 0 && "-mt-6",
              /* The next card overlaps this one's bottom 1.5rem. */
              !last && "pb-6"
            )}
            style={{
              ["--wallet" as string]: walletColor(row, exceeded),
              zIndex: index,
            }}
          >
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setSelectedId(row.id)}
              className="flex h-[4.125rem] w-full items-center gap-3 px-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.18]"
              >
                {row.icon ? (
                  <CategoryGlyph
                    icon={row.icon}
                    name={row.categoryName}
                    className="h-[1.125rem] w-[1.125rem]"
                  />
                ) : (
                  <Target className="h-[1.125rem] w-[1.125rem]" />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-base font-bold">
                {row.name}
              </span>
              <span className="shrink-0 text-heading font-extrabold tabular-nums tracking-tight">
                {headline}
              </span>
            </button>

            {open ? (
              <div
                id={panelId}
                className="animate-in px-5 pb-5 fade-in-0 duration-[var(--motion-standard)] motion-reduce:animate-none"
              >
                <p className="text-sm font-semibold tabular-nums text-white/85">
                  {t(
                    `${money(row.progressAmount)} of ${money(row.target)}`,
                    `${money(row.progressAmount)} de ${money(row.target)}`
                  )}
                </p>
                <span
                  className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.22]"
                  aria-hidden
                >
                  <span
                    className="block h-full rounded-full bg-white transition-[width] duration-[var(--motion-success)] ease-[var(--ease-out-up)] motion-reduce:transition-none"
                    style={{ width: `${fill}%` }}
                  />
                </span>
                <div className="mt-3 flex min-h-11 items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-detail font-semibold text-white/80">
                    {daysRemaining == null
                      ? null
                      : t(
                          `Resets in ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}`,
                          `Se reinicia en ${daysRemaining} ${daysRemaining === 1 ? "día" : "días"}`
                        )}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {onDelete ? (
                      <button
                        type="button"
                        aria-label={t(
                          `Delete ${row.name}`,
                          `Eliminar ${row.name}`
                        )}
                        onClick={() => onDelete(row.id)}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.14] transition-colors hover:bg-white/25"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={() => onEdit(row.id)}
                        className="flex h-11 items-center rounded-full bg-white/[0.18] px-[1.125rem] text-detail font-bold transition-colors hover:bg-white/30"
                      >
                        {t("Edit", "Editar")}
                      </button>
                    ) : null}
                  </span>
                </div>
              </div>
            ) : (
              <span
                id={panelId}
                aria-hidden
                className="mx-5 -mt-2 mb-2.5 block h-[3px] overflow-hidden rounded-full bg-white/[0.22]"
              >
                <span
                  className="block h-full rounded-full bg-white"
                  style={{ width: `${fill}%` }}
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
