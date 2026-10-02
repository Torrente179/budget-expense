"use client";

import { cn } from "@/lib/utils";
import { MerchantMark } from "@/components/patterns/merchant-mark";
import { AmountText } from "@/components/patterns/amount-text";
import { useLocale } from "@/providers/locale-provider";
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
  /** Legacy feed tint flag. Accepted for callers; Card Stream has no stripes. */
  alt?: boolean;
}

/**
 * The canonical ledger row: a round tinted mark, the name in bold, a small
 * muted subtitle, and the amount right-aligned.
 *
 * Outflows render in plain text and inflows in mint with a `+`. Ordinary
 * spending is never red — red is reserved for a tracker over its limit. A row
 * awaiting review carries a small accent chip ahead of its subtitle.
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
  const { t } = useLocale();

  const content = (
    <>
      <MerchantMark
        title={title}
        color={category?.color}
        icon={category?.icon}
        categoryName={categoryName}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold leading-snug text-foreground">
          {title}
        </p>
        {(subtitle || needsReview) && (
          <div className="mt-px flex min-w-0 items-center gap-1.5">
            {needsReview && (
              <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-primary/15 px-2 text-label font-extrabold text-primary">
                {t("Review", "Revisar")}
              </span>
            )}
            {subtitle && (
              <p className="truncate text-detail font-medium text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="max-w-[46%] shrink-0 text-right leading-tight">
        {/* Outflows carry no sign: a feed is outflows by default, so the minus
            is noise; inflows earn their "+" because they are the exception. */}
        <AmountText
          amount={Math.abs(amount)}
          currency={currency}
          signed={kind === "income"}
          tone={kind === "income" ? "positive" : "default"}
          showOriginal
          className="text-base font-bold"
        />
      </div>
      {trailing}
    </>
  );

  const base = cn(
    "flex min-h-16 w-full items-center gap-3.5 px-4 py-2 text-left",
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
