"use client";

import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/shared/category-badge";
import { AmountText } from "@/components/patterns/amount-text";
import { TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

interface TransactionRowProps {
  title: string;
  /** Secondary line: category name, source, date — caller decides. */
  subtitle?: ReactNode;
  amount: number;
  currency: string;
  kind: "expense" | "income";
  /** Category visual for expenses; income rows get a standard income icon. */
  category?: { icon: string; color: string } | null;
  /** Marks rows awaiting categorization/review. */
  needsReview?: boolean;
  onClick?: () => void;
  className?: string;
  /** Trailing slot after the amount (chevrons, badges). */
  trailing?: ReactNode;
}

/**
 * The canonical ledger row: category icon, title/subtitle, amount.
 * Full-bleed lists compose it inside swipeable/pressable containers.
 */
export function TransactionRow({
  title,
  subtitle,
  amount,
  currency,
  kind,
  category,
  needsReview = false,
  onClick,
  className,
  trailing,
}: TransactionRowProps) {
  const content = (
    <>
      {kind === "income" ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-subtle text-success ring-1 ring-success/20">
          <TrendingUp className="h-4 w-4" />
        </div>
      ) : (
        <CategoryIcon
          icon={category?.icon ?? "more-horizontal"}
          color={category?.color ?? "var(--muted-foreground)"}
          className="h-9 w-9 shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-body font-medium text-foreground">
            {title}
          </p>
          {needsReview && (
            <span
              aria-label="Needs review"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
            />
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 truncate text-caption text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <AmountText
          amount={kind === "expense" ? -Math.abs(amount) : amount}
          currency={currency}
          signed={kind === "income"}
          tone={kind === "income" ? "positive" : "default"}
          showOriginal
        />
      </div>
      {trailing}
    </>
  );

  const base = cn(
    "flex min-h-16 w-full items-center gap-3 px-4 py-2.5 text-left",
    className
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          base,
          "transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={base}>{content}</div>;
}
