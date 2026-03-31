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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <MonthPicker month={month} year={year} onChange={onMonthChange} />
      <div className="flex flex-1 gap-2">
        <Select value={categoryId} onValueChange={(v) => v && onCategoryChange(v)}>
          <SelectTrigger className="w-[160px] text-sm">
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
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-8 text-sm"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
