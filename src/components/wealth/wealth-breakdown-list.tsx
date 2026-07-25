"use client";

import Link from "next/link";
import {
  ChevronRight,
  CreditCard,
  HandCoins,
  PiggyBank,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/patterns/section-header";
import { ProgressMeter } from "@/components/patterns/progress-meter";
import { EmptyState } from "@/components/shared/empty-state";
import { PALETTE, type WealthCategory } from "@/lib/palette";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

export interface BreakdownRow {
  key: string;
  category: WealthCategory;
  label: string;
  detail?: string;
  value: number;
  href?: string;
}

const ICONS: Record<WealthCategory, LucideIcon> = {
  accounts: Wallet,
  savings: PiggyBank,
  investments: TrendingUp,
  lent: HandCoins,
  debts: CreditCard,
};

interface WealthBreakdownListProps {
  eyebrow: string;
  title: string;
  rows: BreakdownRow[];
  total: number;
  totalLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: LucideIcon;
}

/**
 * The Activos / Deudas tab body: every line of the balance sheet with its
 * share of the total, so the composition is legible without a chart.
 */
export function WealthBreakdownList({
  eyebrow,
  title,
  rows,
  total,
  totalLabel,
  emptyTitle,
  emptyDescription,
  emptyIcon,
}: WealthBreakdownListProps) {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();

  const populated = rows.filter((row) => row.value !== 0);

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          action={
            populated.length > 0 ? (
              <span className="text-right">
                <span className="label-caps block">{totalLabel}</span>
                <span className="block font-mono text-heading font-semibold tabular-nums">
                  {formatCurrency(total, baseCurrency)}
                </span>
              </span>
            ) : undefined
          }
        />
      </CardHeader>
      <CardContent>
        {populated.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {populated.map((row) => {
              const accent = PALETTE.wealth[row.category];
              const Icon = ICONS[row.category];
              const share = total > 0 ? row.value / total : 0;

              const body = (
                <>
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${accent}1f`, color: accent }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1 space-y-1.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-body font-medium">
                        {row.label}
                      </span>
                      <span className="shrink-0 font-mono text-body tabular-nums">
                        {formatCurrency(row.value, baseCurrency)}
                      </span>
                    </span>

                    <ProgressMeter ratio={share} tone="neutral" />

                    <span className="flex items-center justify-between gap-3 text-caption text-muted-foreground">
                      <span className="min-w-0 truncate">
                        {row.detail ?? t("of the total", "del total")}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums">
                        {Math.round(share * 100)}%
                      </span>
                    </span>
                  </span>
                </>
              );

              return (
                <li key={row.key}>
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="group flex items-center gap-3 py-3.5 transition-opacity hover:opacity-80"
                    >
                      {body}
                      <ChevronRight
                        aria-hidden
                        className="h-4 w-4 shrink-0 self-center text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 py-3.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
