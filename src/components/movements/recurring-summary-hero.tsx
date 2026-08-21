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
    <section className="-mx-4 overflow-hidden bg-ink text-white sm:-mx-5 md:mx-0 md:rounded-xl">
      <div className="flex min-h-[11.5rem] flex-col items-center justify-center px-5 py-7 text-center md:min-h-[13rem] md:px-8">
        <p className="text-[0.75rem] font-medium tracking-wide text-white/55">
          {label}
        </p>
        {loading ? (
          <span className="mt-2 h-12 w-52 animate-pulse rounded-lg bg-white/10" />
        ) : (
          <AmountText
            amount={totalAmount}
            currency={currency}
            size="display"
            className="money-hero mt-1.5 font-bold text-coral"
          />
        )}
        {loading ? (
          <span className="mt-3 h-2.5 w-36 animate-pulse rounded bg-white/10" />
        ) : (
          <p className="mt-3 text-[0.6875rem] text-white/50">
            {cadenceLabel}
            <span aria-hidden> · </span>
            <span className="text-white/70">
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
