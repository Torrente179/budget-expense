"use client";

import { AmountText } from "@/components/patterns/amount-text";

export interface RecurringSummaryHeroProps {
  label: string;
  totalAmount: number;
  currency: string;
  cadenceLabel: string;
  activeCount: number;
  activeLabel: string;
  pausedCount: number;
  pausedLabel: string;
  loading?: boolean;
}

/** Presentation-only recurring total, reusable by the design fixture route. */
export function RecurringSummaryHero({
  label,
  totalAmount,
  currency,
  cadenceLabel,
  activeCount,
  activeLabel,
  pausedCount,
  pausedLabel,
  loading = false,
}: RecurringSummaryHeroProps) {
  return (
    <section className="-mx-4 overflow-hidden bg-background text-foreground sm:-mx-5 md:mx-0 md:rounded-xl">
      <div className="flex min-h-[11.5rem] flex-col items-center justify-center px-5 py-7 text-center md:min-h-[13rem] md:px-8">
        <p className="text-[0.75rem] font-medium tracking-wide text-muted-foreground">
          {label}
        </p>
        {loading ? (
          <span className="mt-2 h-12 w-52 animate-pulse rounded-lg bg-foreground/10" />
        ) : (
          <AmountText
            amount={totalAmount}
            currency={currency}
            size="display"
            className="money-hero mt-1.5 font-bold text-coral"
          />
        )}
        {loading ? (
          <span className="mt-3 h-2.5 w-36 animate-pulse rounded bg-foreground/10" />
        ) : (
          <p className="mt-3 text-[0.6875rem] text-muted-foreground">
            {cadenceLabel}
            <span aria-hidden> · </span>
            <span className="text-foreground/70">
              {activeCount} {activeLabel}
            </span>
            {pausedCount > 0 && (
              <>
                <span aria-hidden> · </span>
                {pausedCount} {pausedLabel}
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
