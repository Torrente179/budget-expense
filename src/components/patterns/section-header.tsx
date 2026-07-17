import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  /** Small label-caps eyebrow above the title. */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Trailing action (link, button, chip). */
  action?: ReactNode;
  className?: string;
}

/** Standard section heading used inside screens and cards. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="label-caps">{eyebrow}</p>}
        <h2 className={cn("text-heading font-semibold", eyebrow && "mt-1")}>
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-caption text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
