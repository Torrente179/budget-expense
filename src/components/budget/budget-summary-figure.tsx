"use client";

import { MoneyFigure } from "@/components/patterns/money-figure";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import type { ReactNode } from "react";

interface BudgetSummaryFigureProps {
  /** Amount in the base currency. Null renders a dash. */
  amount: number | null;
  /** The accent phrase that names the figure, e.g. "Left in Trackers". */
  lead: string;
  /** Continues the lead on the same line, e.g. "17 days to go". */
  detail?: string | null;
  /** A quieter second line, e.g. "€800 of €1,025 spent". */
  meta?: ReactNode;
  /** `over` turns the figure and its lead to the warning colour. */
  tone?: "default" | "over";
  className?: string;
}

/**
 * Budget's headline: one very large figure straight on the page ground, named
 * by a single accent phrase beneath it. No card, no chips — the figure is the
 * summary.
 */
export function BudgetSummaryFigure({
  amount,
  lead,
  detail,
  meta,
  tone = "default",
  className,
}: BudgetSummaryFigureProps) {
  const { baseCurrency } = useCurrency();
  const over = tone === "over";

  return (
    <section className={cn("min-w-0", className)}>
      <MoneyFigure
        amount={amount}
        currency={baseCurrency}
        className={over ? "text-danger" : undefined}
        minorClassName={over ? "text-danger/75" : undefined}
      />
      <p className="mt-3 text-base font-semibold text-muted-foreground">
        <span className={over ? "text-danger" : "text-primary"}>{lead}</span>
        {detail ? ` · ${detail}` : null}
      </p>
      {meta ? (
        <p className="mt-1 text-sm font-medium tabular-nums text-muted-foreground">
          {meta}
        </p>
      ) : null}
    </section>
  );
}
