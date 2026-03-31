"use client";

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
    currency: string;
  }[];
}

export function CategoryBreakdown({
  categoryBreakdown,
}: CategoryBreakdownProps) {
  const { baseCurrency, convert } = useCurrency();

  const data = categoryBreakdown.map((cat) => ({
    name: cat.category_name,
    value: convert(cat.total_amount, cat.currency),
    color: cat.category_color,
    count: cat.expense_count,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">By category</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[240px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">By category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
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
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) =>
                    formatCurrency(Number(value), baseCurrency)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.slice(0, 5).map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {total > 0 ? ((cat.value / total) * 100).toFixed(0) : 0}%
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
