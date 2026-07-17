"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { syncRecurringMonth } from "@/lib/query/sync-recurring";
import { queryKeys } from "@/lib/query/keys";
import { getCurrentMonth, getCurrentYear } from "@/lib/utils";

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
 * Also triggers a best-effort recurring sync when the month changes.
 */
export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const queryClient = useQueryClient();
  const syncedKeyRef = useRef<string | null>(null);

  const setMonthYear = useCallback((nextMonth: number, nextYear: number) => {
    setMonth(nextMonth);
    setYear(nextYear);
  }, []);

  const resetToCurrent = useCallback(() => {
    setMonth(getCurrentMonth());
    setYear(getCurrentYear());
  }, []);

  useEffect(() => {
    const key = `${year}-${month}`;
    if (syncedKeyRef.current === key) return;
    syncedKeyRef.current = key;

    void syncRecurringMonth(month, year)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.monthlySummaryAll,
        });
      })
      .catch((error) => {
        console.error("Failed to sync recurring expenses for month", error);
      });
  }, [month, year, queryClient]);

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
