"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonthPicker } from "@/components/shared/month-picker";
import { Search } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface ExpenseFiltersProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  categories: Category[];
}

export function ExpenseFilters({
  month,
  year,
  onMonthChange,
  categoryId,
  onCategoryChange,
  search,
  onSearchChange,
  categories,
}: ExpenseFiltersProps) {
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
              placeholder={t("Search expenses...", "Buscar gastos...")}
              className="h-11 rounded-2xl pl-9 text-sm"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[auto_180px]">
          <div className="space-y-2">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              {t("Period", "Periodo")}
            </p>
            <MonthPicker month={month} year={year} onChange={onMonthChange} />
          </div>
          <div className="space-y-2">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              {t("Category", "Categoría")}
            </p>
            <Select value={categoryId} onValueChange={(v) => v && onCategoryChange(v)}>
              <SelectTrigger className="h-11 rounded-2xl text-sm">
                <SelectValue placeholder={t("All categories", "Todas las categorías")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("All categories", "Todas las categorías")}
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-sm">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
