"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/constants";

interface CurrencyContextValue {
  baseCurrency: CurrencyCode;
  rates: Record<string, number>;
  isLoading: boolean;
  convert: (amount: number, fromCurrency: string) => number;
  setBaseCurrency: (code: CurrencyCode) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [baseCurrency, setBaseCurrencyState] =
    useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadCurrencyPreference() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("base_currency")
          .eq("id", user.id)
          .single();
        if (data?.base_currency) {
          setBaseCurrencyState(data.base_currency as CurrencyCode);
        }
      }
    }
    loadCurrencyPreference();
  }, [supabase]);

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("/api/exchange-rates");
        if (res.ok) {
          const data = await res.json();
          setRates(data.rates);
        }
      } catch {
        // Rates unavailable — conversion will return original amounts
      } finally {
        setIsLoading(false);
      }
    }
    fetchRates();
  }, []);

  const convert = useCallback(
    (amount: number, fromCurrency: string): number => {
      if (fromCurrency === baseCurrency) return amount;
      const fromRate = rates[fromCurrency];
      const toRate = rates[baseCurrency];
      if (!fromRate || !toRate) return amount;
      return (amount / fromRate) * toRate;
    },
    [baseCurrency, rates]
  );

  const setBaseCurrency = useCallback(
    async (code: CurrencyCode) => {
      setBaseCurrencyState(code);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ base_currency: code })
          .eq("id", user.id);
      }
    },
    [supabase]
  );

  return (
    <CurrencyContext.Provider
      value={{ baseCurrency, rates, isLoading, convert, setBaseCurrency }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
