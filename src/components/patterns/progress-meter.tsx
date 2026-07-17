"use client";

import { cn } from "@/lib/utils";

type MeterTone = "success" | "warning" | "danger" | "neutral";

const toneClass: Record<MeterTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-primary",
};

interface ProgressMeterProps {
  /** Consumed / total, where 1 = 100%. Values above 1 render full + danger. */
  ratio: number;
  /** Override the automatic ok→warning→over tone mapping. */
  tone?: MeterTone;
  className?: string;
  /** Warning threshold as a ratio (default 0.85). */
  warnAt?: number;
}

/** Budget/tithe progress bar with semantic thresholds. */
export function ProgressMeter({
  ratio,
  tone,
  className,
  warnAt = 0.85,
}: ProgressMeterProps) {
  const clamped = Math.max(0, Math.min(ratio, 1));
  const resolvedTone: MeterTone =
    tone ?? (ratio >= 1 ? "danger" : ratio >= warnAt ? "warning" : "success");

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          toneClass[resolvedTone]
        )}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
