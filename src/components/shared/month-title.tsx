"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getMonthName } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";
import { MonthPicker } from "@/components/shared/month-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MonthTitleProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
  /** `title` reads as a screen heading; `pill` is a compact header control. */
  variant?: "title" | "pill";
  /** Disable hover/focus prefetch in deterministic, no-network previews. */
  prefetchAdjacent?: boolean;
  className?: string;
}

/**
 * The month as a header control: the month's name with a chevron, opening the
 * stepper in a popover. It keeps the month switch in the header row instead of
 * spending a second row on it.
 */
export function MonthTitle({
  month,
  year,
  onChange,
  variant = "title",
  prefetchAdjacent = true,
  className,
}: MonthTitleProps) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const name = getMonthName(month, locale);
  const isThisYear = year === new Date().getFullYear();
  const label =
    variant === "pill"
      ? `${name.slice(0, 3)}${isThisYear ? "" : ` ${year}`}`
      : `${name}${isThisYear ? "" : ` ${year}`}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={t(
              `Month: ${name} ${year}. Change month`,
              `Mes: ${name} ${year}. Cambiar mes`
            )}
            className={cn(
              "inline-flex min-h-11 max-w-full items-center gap-1.5 capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              variant === "pill"
                ? "rounded-full border border-border bg-card pl-4 pr-3 text-body font-bold hover:bg-accent"
                : "rounded-lg text-heading font-bold tracking-normal md:text-screen md:font-extrabold",
              className
            )}
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-[var(--motion-standard)]",
            variant === "title" && "md:h-5 md:w-5",
            open && "rotate-180"
          )}
          strokeWidth={2.4}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-1.5">
        <MonthPicker
          month={month}
          year={year}
          onChange={onChange}
          prefetchAdjacent={prefetchAdjacent}
        />
      </PopoverContent>
    </Popover>
  );
}
