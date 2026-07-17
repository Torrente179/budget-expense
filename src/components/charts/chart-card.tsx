"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/patterns/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useChartMounted } from "@/components/charts/chart-theme";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ChartCardProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Plot height in pixels (default 260). */
  height?: number;
  children: ReactNode;
  className?: string;
}

/**
 * Card wrapper for charts: standard header, fixed-height plot area,
 * and a layout-shaped skeleton until the chart can measure itself.
 */
export function ChartCard({
  eyebrow,
  title,
  description,
  action,
  height = 260,
  children,
  className,
}: ChartCardProps) {
  const mounted = useChartMounted();

  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={action}
        />
      </CardHeader>
      <CardContent className="pb-1">
        <div style={{ height }} className="w-full min-w-0">
          {mounted ? (
            children
          ) : (
            <Skeleton className="h-full w-full rounded-lg" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
