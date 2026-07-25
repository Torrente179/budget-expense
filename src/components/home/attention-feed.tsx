"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Compass,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { addDays, differenceInCalendarDays } from "date-fns";
import { buildPersonalization } from "@/lib/onboarding/personalize";
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/patterns/section-header";
import type { ReactNode } from "react";
import type { OnboardingProfile } from "@/hooks/use-onboarding";
import type { MonthSnapshot } from "@/lib/data";

interface FeedItem {
  key: string;
  href: string;
  icon: ReactNode;
  title: string;
  caption: ReactNode;
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
 * "What needs me": review queue, spending anomalies, budgets near limits,
 * onboarding hints, and bills due in the next 7 days.
 */
export function AttentionFeed({
  incomplete,
  profile,
  reviewCount,
  budgets,
  recurringExpenses,
}: {
  incomplete: boolean;
  profile: OnboardingProfile | null;
  reviewCount: number;
  budgets: Array<{ id: string; name: string; ratio: number }>;
  recurringExpenses: MonthSnapshot["recurringExpenses"];
}) {
  const { t, tc } = useLocale();
  const { baseCurrency, convert } = useCurrency();

  const items = useMemo<FeedItem[]>(() => {
    const result: FeedItem[] = [];
    const today = new Date();

    if (incomplete) {
      result.push({
        key: "finish-setup",
        href: "/onboarding",
        icon: <Compass className="h-4 w-4" />,
        title: t("Finish setup", "Terminar configuración"),
        caption: t(
          "Add income, bills, and goals so Home fits you",
          "Añade ingresos, gastos fijos y metas para personalizar Inicio"
        ),
        tone: "info",
      });
    }

    if (profile) {
      const personalization = buildPersonalization({
        wantsBudgetHelp: profile.wants_budget_help === true,
        goals: profile.primary_goals,
        hasDebts: profile.primary_goals.includes("pay_debt"),
      });
      for (const hint of personalization.attentionHints) {
        if (hint === "pay_debt") {
          result.push({
            key: "hint-pay-debt",
            href: "/wealth/liabilities",
            icon: <Wallet className="h-4 w-4" />,
            title: t("Review your debts", "Revisa tus deudas"),
            caption: t(
              "Track balances and payments in Wealth",
              "Sigue saldos y pagos en Patrimonio"
            ),
            tone: "info",
          });
        }
        if (hint === "decrease_expenses") {
          result.push({
            key: "hint-decrease",
            href: "/insights",
            icon: <PiggyBank className="h-4 w-4" />,
            title: t("Find spending to cut", "Encuentra gastos a recortar"),
            caption: t(
              "Insights shows where money is going",
              "Insights muestra a dónde va el dinero"
            ),
            tone: "info",
          });
        }
      }
    }

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

    const envelopeAlerts = budgets
      .filter((budget) => Number.isFinite(budget.ratio) && budget.ratio >= 0.8)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 3);

    for (const alert of envelopeAlerts) {
      const percent = Math.round(alert.ratio * 100);
      const threshold = percent >= 100 ? 100 : 80;
      result.push({
        key: `envelope-${alert.id}-${threshold}`,
        href: "/budget",
        icon: <AlertTriangle className="h-4 w-4" />,
        title:
          threshold >= 100
            ? t(`${alert.name} is over budget`, `${alert.name} supera el presupuesto`)
            : t(
                `${alert.name} is at ${percent}%`,
                `${alert.name} va al ${percent}%`
              ),
        caption: t(
          "Open Budget to adjust or pause spending",
          "Abre Presupuesto para ajustar o pausar el gasto"
        ),
        tone: "warning",
      });
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
        caption: (
          <>
            <span className="font-mono tabular-nums text-foreground">
              {formatCurrency(
                convert(recurring.amount, recurring.currency),
                baseCurrency
              )}
            </span>
            {t(` due ${dueLabel}`, ` vence ${dueLabel}`)}
          </>
        ),
        tone: "info",
      });
    }

    return result;
  }, [
    incomplete,
    profile,
    reviewCount,
    recurringExpenses,
    budgets,
    t,
    tc,
    baseCurrency,
    convert,
  ]);

  /* Nothing pending: one calm line, not a full card of empty space. */
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-card px-4 py-3 ring-1 ring-border shadow-1">
        <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-success" />
        <p className="min-w-0 truncate text-body text-muted-foreground">
          <span className="font-medium text-foreground">
            {t("All clear", "Todo en orden")}
          </span>{" "}
          {t(
            "— nothing waiting this week.",
            "— nada pendiente esta semana."
          )}
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          eyebrow={t("This week", "Esta semana")}
          title={t("Worth a look", "Conviene mirar")}
        />
      </CardHeader>
      <CardContent className="px-2 pb-2">
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
      </CardContent>
    </Card>
  );
}
