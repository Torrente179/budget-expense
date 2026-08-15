import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FrameProps {
  /** Fraction of true device size. 1 renders at 390×844 / 1280×800. */
  scale: number;
  /** What the screen shows, for anyone who cannot see it. */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * A product screen presented as a screenshot.
 *
 * The subtree is real app markup, so it carries real links and real buttons —
 * `inert` takes the whole thing out of the tab order and kills pointer events,
 * and `role="img"` collapses it to its label for assistive tech. A visitor is
 * looking at a picture of the app, not operating a copy of it.
 */
export function PhoneFrame({ scale, label, children, className }: FrameProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("device-phone", className)}
      style={{ "--device-scale": scale } as React.CSSProperties}
    >
      <div className="device-phone-screen device-lift" inert>
        {children}
      </div>
    </div>
  );
}

export function BrowserFrame({ scale, label, children, className }: FrameProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("device-window", className)}
      style={{ "--device-scale": scale } as React.CSSProperties}
    >
      <div className="device-window-screen device-lift" inert>
        <div className="flex h-9 items-center gap-1.5 border-b border-border bg-secondary px-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/35" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/35" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/35" />
          <span className="ml-3 flex h-5.5 min-w-64 items-center rounded-md bg-card px-3 text-label text-muted-foreground">
            budget-expense.app/home
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
