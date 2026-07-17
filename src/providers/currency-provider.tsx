"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/constants";

export type RateSource = "ecb" | "open-er-api" | "manual" | "fallback";

interface CurrencyContextValue {
  baseCurrency: CurrencyCode;
  rates: Record<string, number>;
  /** Provenance per currency — badge anything that isn't "ecb". */
  rateSources: Record<string, RateSource>;
  isLoading: boolean;
  convert: (amount: number, fromCurrency: string) => number;
  setBaseCurrency: (code: CurrencyCode) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [baseCurrency, setBaseCurrencyState] =
    useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [rateSources, setRateSources] = useState<Record<string, RateSource>>(
    {}
  );
  const [manualRates, setManualRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadCurrencyPreference() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("base_currency, manual_fx_rates")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.base_currency) {
        setBaseCurrencyState(data.base_currency as CurrencyCode);
      }
      if (data?.manual_fx_rates && typeof data.manual_fx_rates === "object") {
        const manual: Record<string, number> = {};
        for (const [code, rate] of Object.entries(
          data.manual_fx_rates as Record<string, unknown>
        )) {
          if (typeof rate === "number" && rate > 0) manual[code] = rate;
        }
        setManualRates(manual);
      }
    }
    loadCurrencyPreference().catch(() => {
      // manual_fx_rates column may not exist yet (migration pending)
    });
  }, [supabase]);

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("/api/exchange-rates");
        if (res.ok) {
          const data = await res.json();
          setRates(data.rates ?? {});
          setRateSources(data.sources ?? {});
        }
      } catch {
        // Rates unavailable — conversion will return original amounts
      } finally {
        setIsLoading(false);
      }
    }
    fetchRates();
  }, []);

  const effectiveRates = useMemo(
    () => ({ ...rates, ...manualRates }),
    [rates, manualRates]
  );

  const effectiveSources = useMemo(() => {
    const sources: Record<string, RateSource> = { ...rateSources };
    for (const code of Object.keys(manualRates)) {
      sources[code] = "manual";
    }
    return sources;
  }, [rateSources, manualRates]);

  const convert = useCallback(
    (amount: number, fromCurrency: string): number => {
      if (fromCurrency === baseCurrency) return amount;
      const fromRate = effectiveRates[fromCurrency];
      const toRate = effectiveRates[baseCurrency];
      if (!fromRate || !toRate) return amount;
      return (amount / fromRate) * toRate;
    },
    [baseCurrency, effectiveRates]
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

  const value = useMemo(
    () => ({
      baseCurrency,
      rates: effectiveRates,
      rateSources: effectiveSources,
      isLoading,
      convert,
      setBaseCurrency,
    }),
    [
      baseCurrency,
      effectiveRates,
      effectiveSources,
      isLoading,
      convert,
      setBaseCurrency,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
