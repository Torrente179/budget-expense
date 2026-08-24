import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContinuousSheetProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

/**
 * UP's light content plane: one uninterrupted sheet, divided by rules instead
 * of a stack of individually elevated cards. It is edge-to-edge on the mobile
 * canvas and becomes a contained surface beside the desktop rail.
 */
export function ContinuousSheet({
  children,
  className,
  ...props
}: ContinuousSheetProps) {
  return (
    <section
      className={cn(
        "-mx-4 overflow-hidden bg-card text-card-foreground sm:-mx-5 md:mx-0 md:rounded-xl md:ring-1 md:ring-border",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

interface SheetSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Optional heading content rendered above the section body. */
  header?: ReactNode;
  /** Remove the standard horizontal gutter for full-width rows or tables. */
  flush?: boolean;
}

/** A semantic chapter within a ContinuousSheet. */
export function SheetSection({
  children,
  header,
  flush = false,
  className,
  ...props
}: SheetSectionProps) {
  return (
    <div
      className={cn(
        "border-b border-border/70 last:border-b-0",
        !flush && "px-4 py-5 sm:px-5",
        className
      )}
      {...props}
    >
      {header ? (
        <div className={cn("mb-4", flush && "px-4 pt-5 sm:px-5")}>
          {header}
        </div>
      ) : null}
      {children}
    </div>
  );
}
