"use client";

import { useSyncExternalStore } from "react";
import { useCurrency } from "@/providers/currency-provider";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/providers/locale-provider";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CategoryBreakdownProps {
  categoryBreakdown: {
    category_id: string;
    category_name: string;
    category_color: string;
    category_icon: string;
    total_amount: number;
    expense_count: number;
  }[];
  onCategoryClick?: (categoryId: string) => void;
}

export function CategoryBreakdown({
  categoryBreakdown,
  onCategoryClick,
}: CategoryBreakdownProps) {
  const { baseCurrency } = useCurrency();
  const { t, tc } = useLocale();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  const data = categoryBreakdown.map((cat) => ({
    id: cat.category_id,
    name: tc(cat.category_name),
    value: cat.total_amount,
    color: cat.category_color,
    count: cat.expense_count,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <Card className="border-border/80 bg-card/96">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-[1.45rem] font-semibold tracking-tight">
            {t("By category", "Por categoría")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[240px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {t("No data yet", "Sin datos todavía")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 bg-card/96">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
              {t("Spending mix", "Distribución del gasto")}
            </p>
            <CardTitle className="mt-2 font-heading text-[1.45rem] font-semibold tracking-tight">
              {t("By category", "Por categoría")}
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(`${data.length} active`, `${data.length} activas`)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
          <div className="h-[180px] w-[180px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {data.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.color}
                        onClick={
                          onCategoryClick
                            ? () => onCategoryClick(entry.id)
                            : undefined
                        }
                        style={
                          onCategoryClick ? { cursor: "pointer" } : undefined
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "18px",
                    fontSize: "12px",
                    boxShadow: "0 28px 80px -44px rgba(0,0,0,0.9)",
                  }}
                  formatter={(value) =>
                    formatCurrency(Number(value), baseCurrency)
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-full bg-muted/50" />
            )}
          </div>
          <div className="flex-1 divide-y divide-border/70 rounded-[1.35rem] border border-border/70 bg-secondary/40 px-4">
            {data.slice(0, 5).map((cat) => (
              <div
                key={cat.name}
                role={onCategoryClick ? "button" : undefined}
                tabIndex={onCategoryClick ? 0 : undefined}
                onClick={onCategoryClick ? () => onCategoryClick(cat.id) : undefined}
                onKeyDown={
                  onCategoryClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onCategoryClick(cat.id);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "py-3 text-sm first:pt-4 last:pb-4",
                  onCategoryClick && "cursor-pointer transition-colors hover:bg-secondary/60"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-foreground">{tc(cat.name)}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {total > 0 ? ((cat.value / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {t(
                      `${cat.count} expense${cat.count !== 1 ? "s" : ""}`,
                      `${cat.count} gasto${cat.count !== 1 ? "s" : ""}`
                    )}
                  </span>
                  <span className="font-mono text-xs font-medium">
                    {formatCurrency(cat.value, baseCurrency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
