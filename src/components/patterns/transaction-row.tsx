"use client";

import { cn } from "@/lib/utils";
import { MerchantMark } from "@/components/patterns/merchant-mark";
import { AmountText } from "@/components/patterns/amount-text";
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
  /** Category name, so the glyph still resolves when `icon` is empty. */
  categoryName?: string;
  /** Marks rows awaiting categorization/review. */
  needsReview?: boolean;
  onClick?: () => void;
  className?: string;
  /** Trailing slot after the amount (chevrons, badges). */
  trailing?: ReactNode;
  /** Alternating feed tint. Set by the list, not the row — see FeedList. */
  alt?: boolean;
}

/**
 * The canonical ledger row, in Up's feed shape: merchant mark, name, a small
 * grey subtitle, amount right-aligned.
 *
 * Outflows render in plain ink and inflows in mint with a `+`. Up never puts
 * ordinary spending in red — red is reserved for a budget actually over its
 * limit — so `tone` stays `default` for expenses.
 */
export function TransactionRow({
  title,
  subtitle,
  amount,
  currency,
  kind,
  category,
  categoryName,
  needsReview = false,
  onClick,
  className,
  trailing,
  alt = false,
}: TransactionRowProps) {
  const content = (
    <>
      <MerchantMark
        title={title}
        color={category?.color}
        icon={category?.icon}
        categoryName={categoryName}
        round={kind === "income"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-body font-semibold text-foreground">
            {title}
          </p>
          {needsReview && (
            <span
              role="img"
              aria-label="Needs review"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
            />
          )}
        </div>
        {subtitle && (
          <p className="truncate text-caption text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      <div className="max-w-[46%] shrink-0 text-right leading-tight">
        {/* Outflows carry no sign. In Up a feed is outflows by default, so the
            minus is noise; inflows earn their "+" precisely because they are
            the exception. */}
        <AmountText
          amount={Math.abs(amount)}
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
    "flex min-h-[3.25rem] w-full items-center gap-3 px-4 py-2 text-left",
    alt && "up-stripe",
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
