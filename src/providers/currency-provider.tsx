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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/constants";
import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import { queryKeys } from "@/lib/query/keys";
import type { AppBootstrap } from "@/lib/data";

export type RateSource = "ecb" | "open-er-api" | "manual" | "fallback";
const EMPTY_RATES: Record<string, number> = {};
const EMPTY_SOURCES: Record<string, RateSource> = {};

interface CurrencyContextValue {
  baseCurrency: CurrencyCode;
  rates: Record<string, number>;
  /** Provenance per currency — badge anything that isn't "ecb". */
  rateSources: Record<string, RateSource>;
  isLoading: boolean;
  currencyPreferenceReady: boolean;
  currencyPreferenceUpdating: boolean;
  convert: (amount: number, fromCurrency: string) => number;
  setBaseCurrency: (code: CurrencyCode) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [baseCurrency, setBaseCurrencyState] =
    useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [manualRates, setManualRates] = useState<Record<string, number>>({});
  const [currencyPreferenceReady, setCurrencyPreferenceReady] =
    useState(false);
  const [currencyPreferenceUpdating, setCurrencyPreferenceUpdating] =
    useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();
  const bootstrap = useAppBootstrap();
  const ratesQuery = useQuery({
    queryKey: queryKeys.exchangeRates,
    staleTime: 60 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/exchange-rates", { signal });
      if (!response.ok) throw new Error("Exchange rates unavailable");
      return response.json() as Promise<{
        rates: Record<string, number>;
        sources: Record<string, RateSource>;
      }>;
    },
  });
  const rates = ratesQuery.data?.rates ?? EMPTY_RATES;
  const rateSources = ratesQuery.data?.sources ?? EMPTY_SOURCES;

  useEffect(() => {
    const profile = bootstrap.data?.profile;
    if (!profile) return;
    setBaseCurrencyState(profile.baseCurrency as CurrencyCode);
    setCurrencyPreferenceReady(true);
    const manual: Record<string, number> = {};
    if (profile.manualFxRates && typeof profile.manualFxRates === "object") {
      for (const [code, rate] of Object.entries(profile.manualFxRates)) {
        if (typeof rate === "number" && rate > 0) manual[code] = rate;
      }
    }
    setManualRates(manual);
  }, [bootstrap.data]);

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
      if (code === baseCurrency) return;

      setCurrencyPreferenceUpdating(true);
      try {
        const userId = bootstrap.data?.identity.id;
        if (!userId) throw new Error("No authenticated user");

        const { data, error } = await supabase
          .from("profiles")
          .update({ base_currency: code })
          .eq("id", userId)
          .select("id")
          .maybeSingle();

        if (error || !data) {
          throw error ?? new Error("Profile currency was not updated");
        }

        setBaseCurrencyState(code);
        setCurrencyPreferenceReady(true);
        queryClient.setQueryData<AppBootstrap>(
          queryKeys.appBootstrap,
          (previous) =>
            previous
              ? {
                  ...previous,
                  profile: { ...previous.profile, baseCurrency: code },
                }
              : previous
        );
      } finally {
        setCurrencyPreferenceUpdating(false);
      }
    },
    [baseCurrency, bootstrap.data?.identity.id, queryClient, supabase]
  );

  const value = useMemo(
    () => ({
      baseCurrency,
      rates: effectiveRates,
      rateSources: effectiveSources,
      isLoading:
        bootstrap.isPending || ratesQuery.isPending || currencyPreferenceUpdating,
      currencyPreferenceReady,
      currencyPreferenceUpdating,
      convert,
      setBaseCurrency,
    }),
    [
      baseCurrency,
      effectiveRates,
      effectiveSources,
      bootstrap.isPending,
      ratesQuery.isPending,
      currencyPreferenceReady,
      currencyPreferenceUpdating,
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
