"use client";

import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { REVIEW_NAV } from "@/lib/navigation";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

export interface HomeReviewPrompt {
  /** How many movements are waiting for a category. */
  count: number;
  /** One waiting movement to name in the prompt, when Home already has it. */
  preview?: { title: string; amount: number; currency: string };
}

/**
 * Home's nudge to clear the review queue. It only exists while something is
 * waiting, so Review needs no standing place in the navigation.
 */
export function ReviewPrompt({
  review,
  className,
}: {
  review: HomeReviewPrompt;
  className?: string;
}) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  if (review.count <= 0) return null;

  const title =
    review.count === 1
      ? t("1 movement to review", "1 movimiento por revisar")
      : t(
          `${review.count} movements to review`,
          `${review.count} movimientos por revisar`
        );
  const detail = review.preview
    ? `${review.preview.title} · ${formatCurrency(
        Math.abs(convert(review.preview.amount, review.preview.currency)),
        baseCurrency,
        intlLocale
      )}`
    : t("Waiting for a category", "Esperando categoría");
  const Icon = REVIEW_NAV.icon;

  return (
    <section
      aria-label={t("To review", "Por revisar")}
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-primary/15 py-2.5 pl-3.5 pr-2.5 ring-1 ring-inset ring-primary/45",
        className
      )}
    >
      <Icon aria-hidden className="h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <h2 className="text-body font-extrabold leading-tight">{title}</h2>
        <p className="mt-0.5 truncate text-detail font-medium text-muted-foreground">
          {detail}
        </p>
      </div>
      <Link
        href={REVIEW_NAV.href}
        className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-coral px-4 text-sm font-extrabold text-on-coral transition-colors hover:bg-[var(--coral-deep)]"
      >
        {t(REVIEW_NAV.label.en, REVIEW_NAV.label.es)}
      </Link>
    </section>
  );
}
