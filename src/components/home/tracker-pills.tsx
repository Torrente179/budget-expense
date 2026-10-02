"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn, formatCurrencyTrim } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

export interface BudgetPaceItem {
  id: string;
  name: string;
  limit: number;
  spent: number;
  ratio: number;
  /** Category `icon` key of the budget's leading category. */
  icon?: string;
  /** Colour of the budget's leading category; tints the pill's dot. */
  color?: string;
}

interface TrackerPillsProps {
  budgets: BudgetPaceItem[];
  className?: string;
}

/**
 * Home's Trackers, as one swipeable row of pills.
 *
 * **Remaining-first**: each pill says what is left (`€124 left`) or, past the
 * limit, what it is over by (`€38 over`). There is never a bare percentage.
 * An over-limit pill takes the warning tint, and that is the only place red
 * appears. Every tracker is in the row; the row scrolls instead of paging.
 */
export function TrackerPills({ budgets, className }: TrackerPillsProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();

  if (budgets.length === 0) {
    return (
      <div className={className}>
        <Link
          href="/budget"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-input px-4 text-sm font-bold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <Plus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
          {t("Set up trackers", "Configurar presupuestos")}
        </Link>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label={t("Trackers", "Presupuestos")}
      className={cn(
        "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {budgets.map((budget) => {
        const overLimit = budget.spent > budget.limit;
        const amount = formatCurrencyTrim(
          Math.abs(budget.limit - budget.spent),
          baseCurrency,
          intlLocale
        );
        const headline = overLimit
          ? t(`${amount} over`, `${amount} de más`)
          : t(`${amount} left`, `quedan ${amount}`);

        return (
          <div key={budget.id} role="listitem" className="shrink-0">
            <Link
              href="/budget"
              aria-label={`${budget.name}: ${headline}`}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-full border pl-3 pr-3.5 text-sm font-semibold transition-colors",
                overLimit
                  ? "border-danger/45 bg-danger-subtle hover:bg-danger/20"
                  : "border-border bg-card hover:bg-accent"
              )}
            >
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: budget.color
                    ? `color-mix(in srgb, ${budget.color} 55%, var(--tint-toward))`
                    : "var(--muted-foreground)",
                }}
              />
              <span className="max-w-[9rem] truncate">{budget.name}</span>
              <span
                className={cn(
                  "whitespace-nowrap font-extrabold tabular-nums",
                  overLimit && "text-danger"
                )}
              >
                {headline}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

interface TrackerListProps {
  budgets: BudgetPaceItem[];
  className?: string;
}

/**
 * The same Trackers as a panel, for wide screens where a scrolling row of
 * pills would waste the width. One row per tracker: its name, what is left or
 * over, and a thin bar for the proportion. Still remaining-first, still no
 * bare percentage, and red only once a limit is passed.
 */
export function TrackerList({ budgets, className }: TrackerListProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl bg-card ring-1 ring-inset ring-border",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <h2 className="text-heading font-extrabold">
          {t("Trackers", "Presupuestos")}
        </h2>
        <Link
          href="/budget"
          className="inline-flex min-h-11 items-center text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          {budgets.length === 0
            ? t("Set up", "Configurar")
            : t("See all", "Ver todos")}
        </Link>
      </div>

      {budgets.length === 0 ? (
        <p className="px-5 pb-5 text-body text-muted-foreground">
          {t(
            "Group categories under a monthly limit and see what is left.",
            "Agrupa categorías bajo un límite mensual y mira cuánto queda."
          )}
        </p>
      ) : (
        <div role="list" className="pb-2">
          {budgets.map((budget) => {
            const overLimit = budget.spent > budget.limit;
            const amount = formatCurrencyTrim(
              Math.abs(budget.limit - budget.spent),
              baseCurrency,
              intlLocale
            );
            const headline = overLimit
              ? t(`${amount} over`, `${amount} de más`)
              : t(`${amount} left`, `quedan ${amount}`);
            const fill = Number.isFinite(budget.ratio)
              ? Math.min(Math.max(budget.ratio, 0), 1) * 100
              : overLimit
                ? 100
                : 0;

            return (
              <div key={budget.id} role="listitem">
                <Link
                  href="/budget"
                  aria-label={`${budget.name}: ${headline}`}
                  className="block px-5 py-3 transition-colors hover:bg-accent/50"
                >
                  <span className="flex items-center gap-2.5 text-body">
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: budget.color
                          ? `color-mix(in srgb, ${budget.color} 55%, var(--tint-toward))`
                          : "var(--muted-foreground)",
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {budget.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-extrabold tabular-nums",
                        overLimit && "text-danger"
                      )}
                    >
                      {headline}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="mt-2.5 block h-1 overflow-hidden rounded-full bg-track"
                  >
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        overLimit ? "bg-danger" : "bg-coral"
                      )}
                      style={{ width: `${fill}%` }}
                    />
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
