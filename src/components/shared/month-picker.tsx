"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMonthName } from "@/lib/calendar";
import { useQueryClient } from "@tanstack/react-query";
import { getMonthSnapshot } from "@/lib/data";
import { queryKeys } from "@/lib/query/keys";

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthPicker({ month, year, onChange }: MonthPickerProps) {
  const queryClient = useQueryClient();

  function adjacent(direction: -1 | 1) {
    const date = new Date(year, month - 1 + direction, 1);
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  }

  function prefetch(direction: -1 | 1) {
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
    <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/70 p-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-xl"
        onClick={handlePrev}
        onPointerEnter={() => prefetch(-1)}
        onFocus={() => prefetch(-1)}
        onTouchStart={() => prefetch(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[126px] text-center text-sm font-medium tracking-tight">
        {getMonthName(month)} {year}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-xl"
        onClick={handleNext}
        onPointerEnter={() => prefetch(1)}
        onFocus={() => prefetch(1)}
        onTouchStart={() => prefetch(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
