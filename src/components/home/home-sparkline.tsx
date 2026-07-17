"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface HomeSparklineProps {
  data: { date: string; total: number }[];
}

/** Isolated so the main Home chunk can lazy-load recharts. */
export function HomeSparkline({ data }: HomeSparklineProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="homeSpark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--chart-1)"
          strokeWidth={1.5}
          fill="url(#homeSpark)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
