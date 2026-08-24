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
  /** Render inside a parent sheet without adding another bordered card. */
  variant?: "card" | "section";
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
  variant = "card",
}: ChartCardProps) {
  const mounted = useChartMounted();

  const header = (
    <SectionHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      action={action}
    />
  );
  const plot = (
    <div style={{ height }} className="w-full min-w-0">
      {mounted ? children : <Skeleton className="h-full w-full rounded-lg" />}
    </div>
  );

  if (variant === "section") {
    return (
      <section className={cn("min-w-0 space-y-4", className)}>
        {header}
        {plot}
      </section>
    );
  }

  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>{header}</CardHeader>
      <CardContent className="pb-1">{plot}</CardContent>
    </Card>
  );
}
