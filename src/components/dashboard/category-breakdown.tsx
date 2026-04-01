"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/providers/currency-provider";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export function CategoryBreakdown({
  categoryBreakdown,
}: CategoryBreakdownProps) {
  const { baseCurrency } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = categoryBreakdown.map((cat) => ({
    name: cat.category_name,
    value: cat.total_amount,
    color: cat.category_color,
    count: cat.expense_count,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <Card className="border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-2xl">By category</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[240px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-2xl">By category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
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
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "18px",
                      fontSize: "12px",
                      boxShadow: "0 24px 60px -40px rgba(31,29,23,0.5)",
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
          <div className="flex-1 space-y-3">
            {data.slice(0, 5).map((cat) => (
              <div
                key={cat.name}
                className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {total > 0 ? ((cat.value / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {cat.count} expense{cat.count !== 1 ? "s" : ""}
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
