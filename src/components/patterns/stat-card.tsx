"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

interface StatCardProps {
  /** Short label above the value (rendered label-caps). */
  label: ReactNode;
  /** The stat itself — typically an AmountText or a formatted percentage. */
  value: ReactNode;
  /** Small line under the value: delta chip, context, progress. */
  detail?: ReactNode;
  icon?: ReactNode;
  href?: string;
  className?: string;
}

/** Compact stat tile used in Home/Wealth/Insights stat rows. */
export function StatCard({
  label,
  value,
  detail,
  icon,
  href,
  className,
}: StatCardProps) {
  const body = (
    <Card
      size="sm"
      className={cn(
        "@container/stat-card h-full min-w-0 justify-between gap-2 px-3.5",
        href &&
          "transition-all duration-200 hover:shadow-2 hover:ring-border/80",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="label-caps truncate">{label}</p>
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      </div>
      <div className="min-w-0">
        <div className="min-w-0 leading-tight">{value}</div>
        {detail && (
          <div className="mt-1 text-caption text-muted-foreground">
            {detail}
          </div>
        )}
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full min-w-0">
        {body}
      </Link>
    );
  }

  return body;
}
