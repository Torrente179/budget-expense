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
import { useCategories } from "@/hooks/use-categories";
import { Search } from "lucide-react";

interface ExpenseFiltersProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function ExpenseFilters({
  month,
  year,
  onMonthChange,
  categoryId,
  onCategoryChange,
  search,
  onSearchChange,
}: ExpenseFiltersProps) {
  const { categories } = useCategories();

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-4 shadow-[0_22px_55px_-42px_rgba(31,29,23,0.4)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="space-y-2">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Period
          </p>
          <MonthPicker month={month} year={year} onChange={onMonthChange} />
        </div>

        <div className="grid gap-4 md:flex-1 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="space-y-2">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Category
            </p>
            <Select value={categoryId} onValueChange={(v) => v && onCategoryChange(v)}>
              <SelectTrigger className="h-11 rounded-2xl text-sm">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-sm">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Search
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                className="h-11 rounded-2xl pl-9 text-sm"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
