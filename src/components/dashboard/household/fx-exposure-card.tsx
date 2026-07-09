"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { HoldingSummary, AccountCashSummary } from "@/lib/investments";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

interface FxExposureCardProps {
  holdings: HoldingSummary[];
  accountSummaries: AccountCashSummary[];
  /** brokerage account id → account currency */
  accountCurrencies: Record<string, string>;
  savingsTransfers: { amount: number; currency: string }[];
  /** Base-value of active liabilities per original currency (subtracted) */
  liabilitiesByCurrency: Record<string, number>;
}

const SEGMENT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-5)",
];

/**
 * Household FX exposure: where the household's value sits by ORIGINAL
 * currency — brokerage holdings (quote currency), brokerage cash (account
 * currency), savings (transfer currency), minus liabilities — expressed as
 * % of the base-currency total. Ecclesiastes 11:2, as a bar chart.
 */
export function FxExposureCard({
  holdings,
  accountSummaries,
  accountCurrencies,
  savingsTransfers,
  liabilitiesByCurrency,
}: FxExposureCardProps) {
  const { t } = useLocale();
  const { baseCurrency, convert, rateSources } = useCurrency();

  const exposure = useMemo(() => {
    const byCurrency = new Map<string, number>();
    const add = (currency: string, baseValue: number) => {
      byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + baseValue);
    };

    for (const holding of holdings) {
      // marketValue is already base-converted; attribute to quote currency
      add(holding.latestCurrency || holding.quoteCurrency, holding.marketValue);
    }
    for (const account of accountSummaries) {
      add(accountCurrencies[account.accountId] ?? "USD", account.estimatedCash);
    }
    for (const transfer of savingsTransfers) {
      add(transfer.currency, convert(Number(transfer.amount), transfer.currency));
    }
    for (const [currency, baseValue] of Object.entries(liabilitiesByCurrency)) {
      add(currency, -baseValue);
    }

    const entries = [...byCurrency.entries()].filter(
      ([, value]) => Math.abs(value) > 0.005
    );
    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    return {
      total,
      segments: entries
        .map(([currency, value]) => ({
          currency,
          value,
          share: total > 0 ? value / total : 0,
        }))
        .sort((a, b) => b.value - a.value),
    };
  }, [
    holdings,
    accountSummaries,
    accountCurrencies,
    savingsTransfers,
    liabilitiesByCurrency,
    convert,
  ]);

  const nonLiveSources = exposure.segments.filter(
    (segment) =>
      rateSources[segment.currency] &&
      rateSources[segment.currency] !== "ecb" &&
      segment.currency !== baseCurrency
  );

  return (
    <Card>
      <CardContent className="space-y-3">
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          {t("FX exposure", "Exposición por divisa")}
        </p>

        {exposure.segments.length === 0 || exposure.total <= 0 ? (
          <p className="text-sm text-muted-foreground">
            {t(
              "Add savings or investments to see the currency split.",
              "Añade ahorros o inversiones para ver el reparto por divisa."
            )}{" "}
            <Link href="/investments" className="underline underline-offset-2">
              {t("Investments", "Inversiones")}
            </Link>
          </p>
        ) : (
          <>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {exposure.segments
                .filter((segment) => segment.share > 0)
                .map((segment, index) => (
                  <div
                    key={segment.currency}
                    style={{
                      width: `${Math.max(segment.share * 100, 1.5)}%`,
                      backgroundColor:
                        SEGMENT_COLORS[index % SEGMENT_COLORS.length],
                    }}
                  />
                ))}
            </div>
            <ul className="space-y-1.5">
              {exposure.segments.map((segment, index) => (
                <li
                  key={segment.currency}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        SEGMENT_COLORS[index % SEGMENT_COLORS.length],
                    }}
                  />
                  <span className="font-medium">{segment.currency}</span>
                  <span className="ml-auto font-mono tabular-nums">
                    {(segment.share * 100).toFixed(1)}%
                  </span>
                  <span className="w-28 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {formatCurrency(segment.value, baseCurrency)}
                  </span>
                </li>
              ))}
            </ul>
            {nonLiveSources.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("Rates for", "Tipos de cambio de")}{" "}
                {nonLiveSources.map((s) => s.currency).join(", ")}{" "}
                {t(
                  "come from a secondary or manual source.",
                  "provienen de una fuente secundaria o manual."
                )}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
