"use client";

import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

interface BudgetRecommendationCardProps {
  name: string;
  overBy: number;
}

export function BudgetRecommendationCard({
  name,
  overBy,
}: BudgetRecommendationCardProps) {
  const { t, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();

  return (
    <div className="rounded-xl bg-danger-subtle px-4 py-4 ring-1 ring-danger/20">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/15 text-danger">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-body font-semibold text-danger">
            {t("Recommendation", "Recomendación")}
          </p>
          <p className="text-body text-foreground">
            {t(
              `${name} exceeds its limit by ${formatCurrency(overBy, baseCurrency, intlLocale)}.`,
              `${name} excede su límite en ${formatCurrency(overBy, baseCurrency, intlLocale)}.`
            )}
          </p>
          <p className="text-caption text-muted-foreground">
            {t(
              "Review spending in this category to get back on plan.",
              "Revisa tus gastos en esta categoría para volver al plan."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
