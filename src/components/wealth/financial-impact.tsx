"use client";

import { PALETTE } from "@/lib/palette";
import { cn, formatCurrency } from "@/lib/utils";
import type { FinancialImpact as Impact } from "@/lib/wealth/transaction-effects";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

interface FinancialImpactProps {
  impact: Impact;
  /** Debt flows read as "Gastos del mes"; asset flows as "Ingresos del mes". */
  flow?: "income" | "expense";
  className?: string;
}

/**
 * "Impacto en tus finanzas" — the block that stops a user mistaking an opening
 * balance for income or a transfer for an expense. Every creation wizard shows
 * it before saving, and it renders the same numbers the write will produce
 * because both come from `resolveFinancialImpact`.
 */
export function FinancialImpact({
  impact,
  flow = "income",
  className,
}: FinancialImpactProps) {
  const { t } = useLocale();
  const { baseCurrency } = useCurrency();

  const rows: { label: string; value: number; tone?: "good" | "bad" }[] = [
    {
      label:
        impact.liabilities !== 0
          ? t("Debts", "Deudas")
          : t("Assets", "Activos"),
      value: impact.liabilities !== 0 ? impact.liabilities : impact.assets,
    },
    {
      label: t("Net worth", "Patrimonio neto"),
      value: impact.netWorth,
      tone: impact.netWorth < 0 ? "bad" : impact.netWorth > 0 ? "good" : undefined,
    },
    {
      label: t("Spendable", "Disponible"),
      value: impact.available,
    },
    flow === "expense"
      ? {
          label: t("Expenses this month", "Gastos del mes"),
          value: impact.monthlyExpense,
        }
      : {
          label: t("Income this month", "Ingresos del mes"),
          value: impact.monthlyIncome,
        },
  ];

  return (
    <div
      className={cn(
        "rounded-xl bg-secondary/40 p-4 ring-1 ring-border/50",
        className
      )}
    >
      <p className="label-caps text-muted-foreground">
        {t("Impact on your finances", "Impacto en tus finanzas")}
      </p>

      <dl className="mt-3 grid gap-3 sm:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="truncate text-caption text-muted-foreground">
              {row.label}
            </dt>
            <dd
              className="mt-0.5 truncate font-mono text-body font-semibold tabular-nums"
              style={{
                color:
                  row.value === 0
                    ? undefined
                    : row.tone === "bad"
                      ? PALETTE.cashflow.expense
                      : row.tone === "good"
                        ? PALETTE.cashflow.income
                        : undefined,
              }}
            >
              {row.value > 0 ? "+" : ""}
              {formatCurrency(row.value, baseCurrency)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
