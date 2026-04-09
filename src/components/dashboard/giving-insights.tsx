"use client";

import { useMemo } from "react";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CategoryIcon } from "@/components/shared/category-badge";
import { HandHeart, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Giving detection                                                   */
/* ------------------------------------------------------------------ */

const GIVING_KEYWORDS = [
  "tithe",
  "diezmo",
  "giving",
  "donation",
  "donación",
  "donacion",
  "charity",
  "caridad",
  "tzedakah",
  "offering",
  "ofrenda",
  "church",
  "iglesia",
  "temple",
  "templo",
  "generosity",
  "generosidad",
  "alms",
  "limosna",
];

function isGivingCategory(categoryName: string): boolean {
  const lower = categoryName.toLowerCase();
  return GIVING_KEYWORDS.some((kw) => lower.includes(kw));
}

function isGivingExpense(expense: GivingExpense): boolean {
  if (isGivingCategory(expense.categoryName)) return true;
  if (expense.description) {
    const lower = expense.description.toLowerCase();
    return GIVING_KEYWORDS.some((kw) => lower.includes(kw));
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GivingExpense {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  category_id: string;
}

interface GivingInsightsProps {
  expenses: GivingExpense[];
  totalIncome: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GivingInsights({ expenses, totalIncome }: GivingInsightsProps) {
  const { baseCurrency, convert } = useCurrency();
  const { t, tc } = useLocale();

  const analysis = useMemo(() => {
    const givingExpenses = expenses.filter(isGivingExpense);
    const totalGiving = givingExpenses.reduce(
      (sum, e) => sum + convert(e.amount, e.currency),
      0
    );
    const givingPercent = totalIncome > 0 ? (totalGiving / totalIncome) * 100 : 0;
    const titheGoal = totalIncome * 0.1;
    const titheProgress = titheGoal > 0 ? (totalGiving / titheGoal) * 100 : 0;

    /* Group by category */
    const byCategory = new Map<
      string,
      {
        name: string;
        icon: string;
        color: string;
        total: number;
        count: number;
      }
    >();

    for (const exp of givingExpenses) {
      const existing = byCategory.get(exp.category_id);
      const amount = convert(exp.amount, exp.currency);
      if (existing) {
        existing.total += amount;
        existing.count += 1;
      } else {
        byCategory.set(exp.category_id, {
          name: exp.categoryName,
          icon: exp.categoryIcon,
          color: exp.categoryColor,
          total: amount,
          count: 1,
        });
      }
    }

    return {
      totalGiving,
      givingPercent,
      titheGoal,
      titheProgress: Math.min(titheProgress, 100),
      isAboveTithe: titheProgress >= 100,
      categories: Array.from(byCategory.values()).sort((a, b) => b.total - a.total),
      count: givingExpenses.length,
    };
  }, [expenses, totalIncome, convert]);

  if (analysis.count === 0 && totalIncome === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="border-border/80 bg-card/96">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <Badge variant="outline" className="bg-secondary/70 text-foreground">
                {t("Giving & stewardship", "Donaciones y mayordomía")}
              </Badge>
              <CardTitle className="font-heading text-[1.5rem] font-semibold leading-none tracking-[-0.04em] md:text-[2rem]">
                {formatCurrency(analysis.totalGiving, baseCurrency)}
              </CardTitle>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.4rem] bg-secondary text-amber-500">
              <HandHeart className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalIncome > 0
              ? t(
                  `${analysis.givingPercent.toFixed(1)}% of your income this month — `,
                  `${analysis.givingPercent.toFixed(1)}% de tu ingreso este mes — `
                )
              : ""}
            {analysis.count > 0
              ? t(
                  `${analysis.count} giving transaction${analysis.count !== 1 ? "s" : ""}`,
                  `${analysis.count} transacci${analysis.count !== 1 ? "ones" : "ón"} de donación`
                )
              : t("No giving transactions yet", "Sin transacciones de donación aún")}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tithe benchmark */}
          {totalIncome > 0 && (
            <div className="rounded-[1.35rem] border border-border/70 bg-secondary/40 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("Tithe benchmark (10%)", "Referencia del diezmo (10%)")}
                </span>
                <span className="font-mono text-foreground">
                  {formatCurrency(analysis.totalGiving, baseCurrency)} / {formatCurrency(analysis.titheGoal, baseCurrency)}
                </span>
              </div>
              <Progress
                value={analysis.titheProgress}
                className="mt-2 [&_[data-slot=progress-indicator]]:bg-amber-500"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {analysis.isAboveTithe
                  ? t(
                      "You have met or exceeded the 10% tithe benchmark this month. Generosity in action.",
                      "Has alcanzado o superado la referencia del 10% de diezmo este mes. Generosidad en acción."
                    )
                  : t(
                      `${formatCurrency(analysis.titheGoal - analysis.totalGiving, baseCurrency)} remaining to reach the 10% benchmark.`,
                      `Faltan ${formatCurrency(analysis.titheGoal - analysis.totalGiving, baseCurrency)} para alcanzar la referencia del 10%.`
                    )}
              </p>
            </div>
          )}

          {/* Category breakdown */}
          {analysis.categories.length > 0 && (
            <div className="space-y-2">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                {t("Giving by category", "Donaciones por categoría")}
              </p>
              {analysis.categories.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2.5"
                >
                  <CategoryIcon
                    icon={cat.icon}
                    color={cat.color}
                    className="h-7 w-7 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{tc(cat.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.count} {t("transaction", "transacci")}{cat.count !== 1 ? (t("s", "ones")) : (t("", "ón"))}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-medium text-amber-600 dark:text-amber-400">
                    {formatCurrency(cat.total, baseCurrency)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Principle */}
          <div className="rounded-[1.35rem] border border-amber-500/20 bg-amber-500/8 p-4">
            <p className="text-sm leading-6 text-foreground/80">
              {t(
                '"Honor the Lord with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing."',
                '"Honra al Señor con tus riquezas, con las primicias de todos tus frutos; entonces tus graneros se llenarán a rebosar."'
              )}
            </p>
            <p className="mt-2 font-mono text-xs text-amber-600 dark:text-amber-400">
              {t("Proverbs 3:9-10", "Proverbios 3:9-10")}
            </p>
          </div>

          {/* Tip */}
          {analysis.count === 0 && (
            <div className="rounded-[1.35rem] border border-border/70 bg-secondary/40 p-4">
              <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {t(
                  "Tip: Create categories named 'Tithe', 'Giving', 'Donation', or 'Tzedakah' and log your giving as expenses. This tracker will automatically detect them.",
                  "Consejo: Crea categorías con nombres como 'Diezmo', 'Donación', 'Ofrenda' o 'Tzedakah' y registra tus donaciones como gastos. Este rastreador las detectará automáticamente."
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
