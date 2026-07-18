import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const dotClass: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-muted-foreground",
};

interface StatusTagProps {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}

/**
 * Quiet status indicator: a small tone-colored dot beside a label in ink.
 * Replaces the old uppercase tinted pills — no border, no shouting caps.
 */
export function StatusTag({
  children,
  tone = "neutral",
  className,
}: StatusTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-caption font-medium text-foreground",
        className
      )}
    >
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass[tone])}
      />
      {children}
    </span>
  );
}
