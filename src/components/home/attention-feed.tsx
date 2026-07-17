"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { useReviewCount } from "@/hooks/use-review-queue";
import { useHouseholdInsights } from "@/hooks/use-household-insights";
import { useRecurringExpenses } from "@/hooks/use-recurring-expenses";
import { detectAnomalies } from "@/lib/insights/anomalies";
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/patterns/section-header";
import type { ReactNode } from "react";

interface FeedItem {
  key: string;
  href: string;
  icon: ReactNode;
  title: string;
  caption: string;
  tone: "warning" | "info";
}

/** Next occurrence of a monthly charge day, from today. */
function nextChargeDate(chargeDay: number, from: Date): Date {
  const clamp = (year: number, monthIndex: number) => {
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    return new Date(year, monthIndex, Math.min(chargeDay, lastDay));
  };
  const thisMonth = clamp(from.getFullYear(), from.getMonth());
  if (thisMonth >= from) return thisMonth;
  return clamp(from.getFullYear(), from.getMonth() + 1);
}

/**
 * "What needs me": review queue, spending anomalies, and bills due in
 * the next 7 days. Every row is a link; empty state says all clear.
 */
export function AttentionFeed() {
  const { t, tc } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const reviewCount = useReviewCount();
  const { insights } = useHouseholdInsights();
  const { recurringExpenses } = useRecurringExpenses();

  const items = useMemo<FeedItem[]>(() => {
    const result: FeedItem[] = [];
    const today = new Date();

    if (reviewCount > 0) {
      result.push({
        key: "review",
        href: "/review",
        icon: <ClipboardCheck className="h-4 w-4" />,
        title: t("Movements to review", "Movimientos por revisar"),
        caption: t(
          `${reviewCount} imported ${reviewCount === 1 ? "movement needs" : "movements need"} a category`,
          `${reviewCount} ${reviewCount === 1 ? "movimiento importado necesita" : "movimientos importados necesitan"} categoría`
        ),
        tone: "warning",
      });
    }

    if (insights) {
      const currentMonthKey = format(today, "yyyy-MM");
      const anomalies = detectAnomalies(
        insights.categoryMonthTotals,
        currentMonthKey
      ).slice(0, 2);
      for (const anomaly of anomalies) {
        result.push({
          key: `anomaly-${anomaly.categoryId}`,
          href: `/insights/categories/${anomaly.categoryId}`,
          icon: <AlertTriangle className="h-4 w-4" />,
          title: t(
            `${tc(anomaly.categoryName)} is running high`,
            `${tc(anomaly.categoryName)} va alto`
          ),
          caption: t(
            `${formatCurrency(anomaly.currentTotal, baseCurrency)} vs ${formatCurrency(anomaly.historicalMean, baseCurrency)} typical`,
            `${formatCurrency(anomaly.currentTotal, baseCurrency)} vs ${formatCurrency(anomaly.historicalMean, baseCurrency)} habitual`
          ),
          tone: "warning",
        });
      }
    }

    const horizon = addDays(today, 7);
    const upcoming = recurringExpenses
      .filter((recurring) => recurring.is_active)
      .map((recurring) => ({
        recurring,
        due: nextChargeDate(recurring.charge_day, today),
      }))
      .filter(({ due }) => due <= horizon)
      .sort((a, b) => a.due.getTime() - b.due.getTime())
      .slice(0, 3);

    for (const { recurring, due } of upcoming) {
      const days = differenceInCalendarDays(due, today);
      const dueLabel =
        days === 0
          ? t("today", "hoy")
          : days === 1
            ? t("tomorrow", "mañana")
            : t(`in ${days} days`, `en ${days} días`);
      result.push({
        key: `recurring-${recurring.id}`,
        href: "/movements/recurring",
        icon: <CalendarClock className="h-4 w-4" />,
        title:
          recurring.description || tc(recurring.categories?.name ?? "—"),
        caption: t(
          `${formatCurrency(convert(recurring.amount, recurring.currency), baseCurrency)} due ${dueLabel}`,
          `${formatCurrency(convert(recurring.amount, recurring.currency), baseCurrency)} vence ${dueLabel}`
        ),
        tone: "info",
      });
    }

    return result;
  }, [reviewCount, insights, recurringExpenses, t, tc, baseCurrency, convert]);

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          eyebrow={t("This week", "Esta semana")}
          title={t("Needs your attention", "Necesita tu atención")}
        />
      </CardHeader>
      <CardContent className="px-2 pb-2">
        {items.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg px-3 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success-subtle text-success">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-body font-medium">
                {t("All clear", "Todo en orden")}
              </p>
              <p className="text-caption text-muted-foreground">
                {t(
                  "Nothing pending — enjoy the peace of mind.",
                  "Nada pendiente — disfruta la tranquilidad."
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="flex min-h-13 items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50"
              >
                <div
                  className={
                    item.tone === "warning"
                      ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-subtle text-warning"
                      : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-subtle text-info"
                  }
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium">{item.title}</p>
                  <p className="truncate text-caption text-muted-foreground">
                    {item.caption}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
