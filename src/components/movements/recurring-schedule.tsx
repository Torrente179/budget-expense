"use client";

import { AmountText } from "@/components/patterns/amount-text";
import { MerchantMark } from "@/components/patterns/merchant-mark";
import { cn } from "@/lib/utils";

export interface RecurringScheduleItem {
  id: string;
  title: string;
  categoryName: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  amount: number;
  currency: string;
  chargeDay: number;
  isActive: boolean;
}

export interface RecurringScheduleProps {
  items: RecurringScheduleItem[];
  title: string;
  rangeLabel: string;
  dayLabel: string;
  activeLabel: string;
  pausedLabel: string;
  onEdit: (id: string) => void;
}

/**
 * A chronological, presentation-only monthly rail. Mutation ownership stays
 * with RecurringScreen; this component only reports which rule was selected.
 */
export function RecurringSchedule({
  items,
  title,
  rangeLabel,
  dayLabel,
  activeLabel,
  pausedLabel,
  onEdit,
}: RecurringScheduleProps) {
  return (
    <section className="up-content-sheet -mx-4 sm:-mx-5 md:mx-0 md:rounded-xl">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 md:px-5">
        <h2 className="text-body font-semibold text-foreground">{title}</h2>
        <p className="text-caption text-muted-foreground">{rangeLabel}</p>
      </header>

      <div className="up-list-stagger">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onEdit(item.id)}
            className={cn(
              "group flex min-h-[4.25rem] w-full items-stretch border-b border-border/60 bg-card text-left transition-colors last:border-b-0 hover:bg-accent/35 focus-visible:bg-accent/35 focus-visible:outline-none",
              !item.isActive && "text-muted-foreground"
            )}
          >
            <span className="flex w-12 shrink-0 flex-col items-center justify-center border-r border-border/60 px-1 md:w-14">
              <span className="text-label font-semibold uppercase tracking-widest text-muted-foreground">
                {dayLabel}
              </span>
              <span className="font-mono text-lg font-bold leading-none tabular-nums text-foreground">
                {String(item.chargeDay).padStart(2, "0")}
              </span>
            </span>

            <span className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 md:px-4">
              <MerchantMark
                title={item.title}
                icon={item.categoryIcon}
                color={item.categoryColor}
                categoryName={item.categoryName}
                className={cn("h-9 w-9", !item.isActive && "grayscale")}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-semibold text-foreground">
                  {item.title}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-caption text-muted-foreground">
                  <span className="truncate">{item.categoryName}</span>
                  <span aria-hidden>·</span>
                  <span className="shrink-0">
                    {item.isActive ? activeLabel : pausedLabel}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                <AmountText
                  amount={-Math.abs(item.amount)}
                  currency={item.currency}
                  tone={item.isActive ? "default" : "muted"}
                  showOriginal
                />
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
