"use client";

import type { ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { PRIMARY_NAV } from "@/lib/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

/**
 * The parts of an app screen that surround the real components: the status
 * bar, the header row, the tab bar and the single centred figure. They are written here
 * rather than imported because the signed-in versions carry routing, month
 * state and viewport breakpoints that a fixed-width screenshot cannot honour.
 *
 * Everything inside a frame uses only the shared tokens and no `sm:`/`lg:`
 * variants, so a frame renders identically whatever the visitor's viewport is.
 */

export function DemoStatusBar() {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between px-7 text-caption font-semibold text-foreground">
      <span>9:41</span>
      <span className="tracking-widest opacity-90">●●● ●</span>
    </div>
  );
}

/**
 * The header row every app screen opens with: the section title on the left,
 * search and the accent add button on the right. A picture of the real header,
 * not the header itself — the live one carries routing and sheet state.
 */
export function DemoRail({ activeKey }: { activeKey: string }) {
  const { locale } = useLocale();
  const active = PRIMARY_NAV.find((item) => item.key === activeKey);

  return (
    <div className="flex shrink-0 items-center gap-2.5 px-5 pt-1.5">
      <span className="flex-1 truncate text-screen font-extrabold">
        {active ? active.label[locale] : null}
      </span>
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card">
        <Search className="h-[1.125rem] w-[1.125rem]" />
      </span>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-coral text-on-coral">
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </span>
    </div>
  );
}

/** The floating capsule navigation, in its resting position. */
export function DemoTabBar({ activeKey }: { activeKey: string }) {
  const { locale } = useLocale();

  return (
    <div className="absolute inset-x-4 bottom-4 z-10 grid h-16 grid-cols-5 rounded-full border border-border bg-surface-2/85 px-1.5 shadow-3 backdrop-blur-xl">
      {PRIMARY_NAV.map((item) => {
        const Icon = item.icon;
        const active = item.key === activeKey;
        return (
          <span
            key={item.key}
            className={cn(
              "flex flex-col items-center justify-center gap-1",
              active ? "text-coral" : "text-muted-foreground"
            )}
          >
            <Icon
              className={cn("h-[1.375rem] w-[1.375rem]", active && "stroke-[2.25]")}
            />
            <span
              className={cn(
                "text-nav tracking-tight",
                active ? "font-extrabold" : "font-semibold"
              )}
            >
              {item.label[locale]}
            </span>
          </span>
        );
      })}
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

/** The top band that carries the header row and the figure. */
export function DemoChrome({ children }: { children: ReactNode }) {
  return <div className="up-chrome shrink-0 pb-3.5">{children}</div>;
}

/** The card-coloured list layer beneath the top band. */
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
