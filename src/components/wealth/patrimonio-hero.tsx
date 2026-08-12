"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus, Plus, Sparkles } from "lucide-react";
import {
  HeroSheen,
  HERO_ACCENT,
  HERO_ACCENT_NEGATIVE,
  HERO_ICON_TILE,
  HERO_RULE,
  HERO_SURFACE,
  HERO_TILE,
} from "@/components/patterns/hero-surface";
import type { MonthlyChange, NetWorthTotals } from "@/lib/wealth/net-worth";
import { cn, formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

interface PatrimonioHeroProps {
  totals: NetWorthTotals;
  monthlyChange: MonthlyChange;
  /** Empty renders the onboarding hero instead of the figures. */
  isEmpty: boolean;
  addHref: string;
}

/**
 * The Patrimonio headline: what you own, what you owe, what you are worth.
 *
 * Wears the shared black chrome from `patterns/hero-surface.tsx` — the same
 * surface as Home and Budget, so the app's three headline figures read as one
 * family. Dark in both themes by design.
 */
export function PatrimonioHero({
  totals,
  monthlyChange,
  isEmpty,
  addHref,
}: PatrimonioHeroProps) {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();

  if (isEmpty) {
    return (
      <section className={cn(HERO_SURFACE, "px-5 py-7 sm:px-7 sm:py-9")}>
        <HeroSheen />
        <div className="relative max-w-xl space-y-4">
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl",
              HERO_ICON_TILE
            )}
          >
            <Sparkles className="h-4 w-4" style={{ color: HERO_ACCENT }} />
          </span>
          <div className="space-y-2">
            <h2 className="text-title font-semibold tracking-tight text-white">
              {t("Build your net worth", "Construye tu patrimonio")}
            </h2>
            <p className="text-body text-white/55">
              {t(
                "Add your accounts, savings, investments and debts to see how your financial position changes over time.",
                "Añade tus cuentas, ahorros, inversiones y deudas para entender cómo evoluciona tu situación financiera."
              )}
            </p>
          </div>
          <Link
            href={addHref}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-body font-medium text-black transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {t("Add your first account", "Añadir primera cuenta")}
          </Link>
        </div>
      </section>
    );
  }

  const negative = totals.netWorth < 0;

  return (
    <section className={cn(HERO_SURFACE, "px-5 py-5 sm:px-6 sm:py-6")}>
      <HeroSheen />
      <div className="relative space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <p className="label-caps text-white/55">
              {t("Your net worth", "Tu patrimonio neto")}
            </p>
            <p
              className={cn(
                "font-mono text-display tabular-nums tracking-tight",
                /* Chrome only reads as an achievement. A negative net worth
                   keeps flat ink so the state is not dressed up. */
                negative ? "text-white/90" : "chrome-figure"
              )}
            >
              {formatCurrency(totals.netWorth, baseCurrency)}
            </p>
            <MonthlyDelta change={monthlyChange} />
          </div>

          <Link
            href={addHref}
            aria-label={t("Add", "Añadir")}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-caption font-medium text-white transition-colors hover:bg-white/[0.12]",
              HERO_TILE
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("Add", "Añadir")}
          </Link>
        </div>

        <div className={cn("grid grid-cols-2 gap-4 border-t pt-4", HERO_RULE)}>
          <SplitFigure
            label={t("Assets", "Activos")}
            value={formatCurrency(totals.totalAssets, baseCurrency)}
          />
          <SplitFigure
            label={t("Debts", "Deudas")}
            value={formatCurrency(totals.totalLiabilities, baseCurrency)}
          />
        </div>
      </div>
    </section>
  );
}

function SplitFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="label-caps text-white/55">{label}</p>
      <p className="mt-1 truncate font-mono text-heading font-semibold tabular-nums text-white">
        {value}
      </p>
    </div>
  );
}

/**
 * Silent when there is no prior snapshot — a first-run user sees nothing here
 * rather than a fabricated "+0,00 € este mes".
 */
function MonthlyDelta({ change }: { change: MonthlyChange }) {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();

  if (change.amount === null) {
    return (
      <p className="text-caption text-white/45">
        {t(
          "Tracking starts today — check back next month.",
          "Empezamos a registrar hoy — vuelve el mes que viene."
        )}
      </p>
    );
  }

  const flat = Math.abs(change.amount) < 0.005;
  const up = change.amount > 0;
  const color = flat
    ? undefined
    : up
      ? HERO_ACCENT
      : HERO_ACCENT_NEGATIVE;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  const sign = up ? "+" : "";
  const percentage =
    change.percentage !== null && !flat
      ? ` · ${sign}${(change.percentage * 100).toFixed(1)}%`
      : "";

  return (
    <p
      className="flex items-center gap-1 text-caption font-medium"
      style={{ color: color ?? "rgba(255,255,255,0.55)" }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-mono tabular-nums">
        {sign}
        {formatCurrency(change.amount, baseCurrency)}
        {percentage}
      </span>
      <span className="text-white/45">{t("this month", "este mes")}</span>
    </p>
  );
}
