"use client";

import type { ReactNode } from "react";
import {
  HeroSheen,
  HERO_ACCENT,
  HERO_ACCENT_NEGATIVE,
  HERO_ICON_TILE,
  HERO_RULE,
  HERO_SURFACE,
} from "@/components/patterns/hero-surface";
import { cn, formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import type { LucideIcon } from "lucide-react";

export interface HeroStat {
  label: string;
  /** Pre-formatted so callers can show dates, counts, or money. */
  value: string;
  tone?: "default" | "positive" | "negative";
}

interface WealthCategoryHeroProps {
  eyebrow: string;
  /** The one number this page is about, in base currency. */
  amount: number;
  icon: LucideIcon;
  /** Signed change for the month; omit when the page has no such figure. */
  delta?: { amount: number; label: string } | null;
  /** Optional progress toward a goal, 0..1. */
  progress?: { ratio: number; label: string } | null;
  stats?: HeroStat[];
  children?: ReactNode;
}

/**
 * The black hero shared by every Patrimonio category page (Ahorros,
 * Inversiones, Dinero prestado, Deudas, Cuentas). Same chrome as the
 * net-worth hero so the section reads as one surface rather than five.
 */
export function WealthCategoryHero({
  eyebrow,
  amount,
  icon: Icon,
  delta,
  progress,
  stats,
  children,
}: WealthCategoryHeroProps) {
  const { baseCurrency } = useCurrency();

  return (
    <section className={cn(HERO_SURFACE, "px-5 py-5 sm:px-6 sm:py-6")}>
      <HeroSheen />
      <div className="relative space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <p className="label-caps text-white/55">{eyebrow}</p>
            <p className="chrome-figure font-mono text-display tabular-nums tracking-tight">
              {formatCurrency(amount, baseCurrency)}
            </p>
            {delta && (
              <p
                className="font-mono text-caption font-medium tabular-nums"
                style={{
                  color:
                    delta.amount === 0
                      ? "rgba(255,255,255,0.55)"
                      : delta.amount > 0
                        ? HERO_ACCENT
                        : HERO_ACCENT_NEGATIVE,
                }}
              >
                {delta.amount > 0 ? "+" : ""}
                {formatCurrency(delta.amount, baseCurrency)}{" "}
                <span className="font-sans text-white/45">{delta.label}</span>
              </p>
            )}
          </div>

          <span
            aria-hidden
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              HERO_ICON_TILE
            )}
          >
            <Icon className="h-[18px] w-[18px] text-white/70" />
          </span>
        </div>

        {progress && (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-caption text-white/55">
                {progress.label}
              </span>
              <span className="font-mono text-caption tabular-nums text-white">
                {Math.round(Math.min(Math.max(progress.ratio, 0), 1) * 100)}%
              </span>
            </div>
            <div className="groove-dark h-1 overflow-hidden rounded-sm">
              <div
                className="h-full rounded-sm transition-[width] duration-500 ease-out"
                style={{
                  width: `${Math.min(Math.max(progress.ratio, 0), 1) * 100}%`,
                  backgroundColor: HERO_ACCENT,
                }}
              />
            </div>
          </div>
        )}

        {stats && stats.length > 0 && (
          <div
            className={cn(
              "grid gap-4 border-t pt-4",
              stats.length >= 3 ? "grid-cols-3" : "grid-cols-2",
              HERO_RULE
            )}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-0">
                <p className="label-caps text-white/55">{stat.label}</p>
                <p
                  className="mt-1 truncate font-mono text-body font-semibold tabular-nums"
                  style={{
                    color:
                      stat.tone === "positive"
                        ? HERO_ACCENT
                        : stat.tone === "negative"
                          ? HERO_ACCENT_NEGATIVE
                          : "#fff",
                  }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}
