"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/shared/month-picker";
import { useLocale } from "@/providers/locale-provider";

interface IncomeFiltersProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function IncomeFilters({
  month,
  year,
  onMonthChange,
  search,
  onSearchChange,
}: IncomeFiltersProps) {
  const { t } = useLocale();

  return (
    <div className="rounded-[1.65rem] border border-border/80 bg-card/96 p-4 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.86)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="flex-1 space-y-2">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {t("Search", "Buscar")}
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("Search incomes...", "Buscar ingresos...")}
              className="h-11 rounded-2xl pl-9 text-sm"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {t("Period", "Periodo")}
          </p>
          <MonthPicker month={month} year={year} onChange={onMonthChange} />
        </div>
      </div>
    </div>
  );
}
