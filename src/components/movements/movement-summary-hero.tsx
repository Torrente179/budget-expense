"use client";

import { AmountText } from "@/components/patterns/amount-text";

export interface MovementSummaryHeroProps {
  label: string;
  netAmount: number;
  incomeLabel: string;
  incomeAmount: number;
  expenseLabel: string;
  expenseAmount: number;
  currency: string;
  showIncome?: boolean;
}

/**
 * The Movements checkpoint: one month-net figure, then quiet in/out context.
 * It is intentionally data-agnostic so the design harness can render fixtures
 * without taking on the screen controller.
 */
export function MovementSummaryHero({
  label,
  netAmount,
  incomeLabel,
  incomeAmount,
  expenseLabel,
  expenseAmount,
  currency,
  showIncome = true,
}: MovementSummaryHeroProps) {
  return (
    <section className="-mx-4 overflow-hidden bg-background text-foreground sm:-mx-5 md:mx-0 md:rounded-xl">
      <div className="flex min-h-[12.5rem] flex-col items-center justify-center px-5 py-7 text-center md:min-h-[14rem] md:px-8 md:py-8">
        <p className="text-[0.75rem] font-medium tracking-wide text-muted-foreground">
          {label}
        </p>
        <AmountText
          amount={netAmount}
          currency={currency}
          size="display"
          className="money-hero mt-1.5 font-bold text-coral"
        />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-left">
          {showIncome && (
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-positive"
              />
              <div>
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {incomeLabel}
                </p>
                <AmountText
                  amount={incomeAmount}
                  currency={currency}
                  tone="positive"
                  size="caption"
                  className="font-semibold text-income"
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-foreground/35"
            />
            <div>
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {expenseLabel}
              </p>
              <AmountText
                amount={expenseAmount}
                currency={currency}
                size="caption"
                className="font-semibold text-foreground"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
