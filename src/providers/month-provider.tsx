"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCurrentMonth, getCurrentYear } from "@/lib/calendar";

interface MonthContextValue {
  month: number;
  year: number;
  /** True when the selected month is the actual current calendar month. */
  isCurrentMonth: boolean;
  setMonthYear: (month: number, year: number) => void;
  resetToCurrent: () => void;
}

const MonthContext = createContext<MonthContextValue | null>(null);

/**
 * Global selected-month state so the chosen month survives switching
 * between sections (Home, Movements, Budget, Insights all read it).
 * Data screens prepare the compact month snapshot only when they need it.
 */
export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());

  const setMonthYear = useCallback((nextMonth: number, nextYear: number) => {
    setMonth(nextMonth);
    setYear(nextYear);
  }, []);

  const resetToCurrent = useCallback(() => {
    setMonth(getCurrentMonth());
    setYear(getCurrentYear());
  }, []);

  const value = useMemo(
    () => ({
      month,
      year,
      isCurrentMonth: month === getCurrentMonth() && year === getCurrentYear(),
      setMonthYear,
      resetToCurrent,
    }),
    [month, year, setMonthYear, resetToCurrent]
  );

  return (
    <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
  );
}

export function useMonth() {
  const context = useContext(MonthContext);

  if (!context) {
    throw new Error("useMonth must be used within a MonthProvider");
  }

  return context;
}
