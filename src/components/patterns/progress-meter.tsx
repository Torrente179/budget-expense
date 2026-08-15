"use client";

import { cn } from "@/lib/utils";
import { budgetUsageColorForRatio } from "@/lib/palette";

type MeterTone = "success" | "warning" | "danger" | "neutral";

const toneClass: Record<MeterTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-primary",
};

interface ProgressMeterProps {
  /** Consumed / total, where 1 = 100%. Values above 1 render full + usage color. */
  ratio: number;
  /**
   * Override automatic usage-band coloring (safe → critical).
   * When omitted, colors match home budget rings.
   */
  tone?: MeterTone;
  className?: string;
  /** @deprecated Unused when tone is omitted; kept for call-site compatibility. */
  warnAt?: number;
}

/** Budget/tithe progress bar. Default colors follow budget usage bands. */
export function ProgressMeter({
  ratio,
  tone,
  className,
}: ProgressMeterProps) {
  const clamped = Math.max(0, Math.min(ratio, 1));
  const usageColor = tone ? null : budgetUsageColorForRatio(ratio);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(Math.max(ratio, 0), 9.99) * 100)}
      /* Up: a flat painted bar. No machined material anywhere in Up. */
      className={cn(
        "up-track h-1 w-full overflow-hidden rounded-sm",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-sm transition-[width] duration-[var(--motion-success)] ease-[var(--ease-out-up)] motion-reduce:transition-none",
          tone && toneClass[tone]
        )}
        style={{
          width: `${clamped * 100}%`,
          ...(usageColor ? { backgroundColor: usageColor } : {}),
        }}
      />
    </div>
  );
}
