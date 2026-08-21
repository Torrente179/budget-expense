"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMonthName } from "@/lib/calendar";
import { useQueryClient } from "@tanstack/react-query";
import { getMonthSnapshot } from "@/lib/data";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/cn";
import { useLocale } from "@/providers/locale-provider";

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
  onInk?: boolean;
  /** Disable hover/focus prefetch in deterministic, no-network previews. */
  prefetchAdjacent?: boolean;
}

export function MonthPicker({
  month,
  year,
  onChange,
  onInk = false,
  prefetchAdjacent = true,
}: MonthPickerProps) {
  const queryClient = useQueryClient();
  const { locale, t } = useLocale();

  function adjacent(direction: -1 | 1) {
    const date = new Date(year, month - 1 + direction, 1);
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  }

  function prefetch(direction: -1 | 1) {
    if (!prefetchAdjacent) return;
    const target = adjacent(direction);
    const now = new Date();
    const asOfDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    void queryClient.prefetchQuery({
      queryKey: queryKeys.monthSnapshot(target.month, target.year, asOfDate),
      queryFn: ({ signal }) => getMonthSnapshot({ ...target, asOfDate, signal }),
    });
  }

  function handlePrev() {
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  }

  function handleNext() {
    if (month === 12) {
      onChange(1, year + 1);
    } else {
      onChange(month + 1, year);
    }
  }

  return (
    <div
      role="group"
      aria-label={t("Month navigation", "Navegación por mes")}
      className={cn(
        "flex items-center gap-1 rounded-lg border p-1",
        onInk
          ? "border-white/10 bg-white/[0.07] text-white"
          : "border-border bg-secondary"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-11 w-11 rounded-xl md:h-8 md:w-8",
          onInk && "text-white hover:bg-white/10 hover:text-white"
        )}
        onClick={handlePrev}
        onPointerEnter={() => prefetch(-1)}
        onFocus={() => prefetch(-1)}
        onTouchStart={() => prefetch(-1)}
        aria-label={t("Previous month", "Mes anterior")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[126px] text-center text-sm font-medium tracking-tight">
        {getMonthName(month, locale)} {year}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-11 w-11 rounded-xl md:h-8 md:w-8",
          onInk && "text-white hover:bg-white/10 hover:text-white"
        )}
        onClick={handleNext}
        onPointerEnter={() => prefetch(1)}
        onFocus={() => prefetch(1)}
        onTouchStart={() => prefetch(1)}
        aria-label={t("Next month", "Mes siguiente")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
