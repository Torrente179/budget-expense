"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMonthName } from "@/lib/utils";

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthPicker({ month, year, onChange }: MonthPickerProps) {
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
    <div className="flex items-center gap-1 rounded-2xl border border-border/70 bg-background/72 p-1 shadow-[0_12px_30px_-26px_rgba(42,36,27,0.5)]">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handlePrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[126px] text-center text-sm font-medium">
        {getMonthName(month)} {year}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
