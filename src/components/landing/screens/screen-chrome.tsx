"use client";

import type { ReactNode } from "react";
import { PRIMARY_NAV } from "@/lib/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

/**
 * The parts of an app screen that surround the real components: the status
 * bar, the section rail and the single centred figure. They are written here
 * rather than imported because the signed-in versions carry routing, month
 * state and viewport breakpoints that a fixed-width screenshot cannot honour.
 *
 * Everything inside a frame uses only the shared tokens and no `sm:`/`lg:`
 * variants, so a frame renders identically whatever the visitor's viewport is.
 */

export function DemoStatusBar() {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between px-7 text-caption font-semibold text-white">
      <span>9:41</span>
      <span className="tracking-widest opacity-90">●●● ●</span>
    </div>
  );
}

/**
 * Up's rail centres the active section and lets its neighbours clip at both
 * edges — that clipping is the affordance that says the row scrolls. Splitting
 * the list around the active item centres it with no measurement.
 */
export function DemoRail({ activeKey }: { activeKey: string }) {
  const { locale } = useLocale();
  const index = PRIMARY_NAV.findIndex((item) => item.key === activeKey);
  const active = PRIMARY_NAV[index];
  const before = PRIMARY_NAV.slice(0, index);
  const after = PRIMARY_NAV.slice(index + 1);
  const label = (item: (typeof PRIMARY_NAV)[number]) => item.label[locale];

  return (
    <div className="flex shrink-0 items-center overflow-hidden py-1.5">
      <div className="flex flex-1 basis-0 justify-end gap-6 overflow-hidden pr-3">
        {before.map((item) => (
          <span
            key={item.key}
            className="shrink-0 text-body font-semibold whitespace-nowrap text-white/50"
          >
            {label(item)}
          </span>
        ))}
      </div>
      <span className="shrink-0 text-body font-bold whitespace-nowrap text-white">
        {active ? label(active) : null}
      </span>
      <div className="flex flex-1 basis-0 justify-start gap-6 overflow-hidden pl-3">
        {after.map((item) => (
          <span
            key={item.key}
            className="shrink-0 text-body font-semibold whitespace-nowrap text-white/50"
          >
            {label(item)}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * One centred figure and a small label — never two figures side by side.
 * `coral` is Home's spendable headline; `white` is the neutral headline the
 * other screens use so coral stays the "money you can spend" colour.
 */
export function DemoHero({
  amount,
  currency,
  label,
  tone = "coral",
  detail,
  detailTone = "income",
}: {
  amount: number;
  currency: string;
  label: string;
  tone?: "coral" | "white";
  detail?: string;
  detailTone?: "income" | "coral";
}) {
  const { intlLocale } = useLocale();

  return (
    <div className="shrink-0 px-5 pt-5 text-center">
      <p
        className={cn(
          "text-display font-bold tabular-nums",
          tone === "coral" ? "up-figure" : "text-white"
        )}
      >
        {formatCurrency(amount, currency, intlLocale)}
      </p>
      <p
        className={cn(
          "mt-0.5 text-body font-medium",
          tone === "coral" ? "text-coral/90" : "text-white/55"
        )}
      >
        {label}
      </p>
      {detail && (
        <p
          className={cn(
            "mt-1.5 text-caption font-semibold",
            detailTone === "income" ? "text-income" : "text-coral"
          )}
        >
          {detail}
        </p>
      )}
    </div>
  );
}

/** The ink band that carries the rail and the figure. */
export function DemoChrome({ children }: { children: ReactNode }) {
  return <div className="up-chrome shrink-0 pb-3.5">{children}</div>;
}

/** The white transactional layer that rides over the chrome. */
export function DemoSheet({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("up-sheet flex-1 rounded-t-2xl", className)}>
      {children}
    </div>
  );
}

/** The capture FAB, in its resting position over the sheet. */
export function DemoFab() {
  return (
    <span className="up-fab-glow absolute right-5 bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-normal text-primary-foreground">
      +
    </span>
  );
}
