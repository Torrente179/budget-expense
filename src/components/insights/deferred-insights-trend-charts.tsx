"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { InsightsTrendChartsProps } from "@/components/insights/insights-trend-charts";

const InsightsTrendCharts = dynamic(() =>
  import("@/components/insights/insights-trend-charts").then(
    (module) => module.InsightsTrendCharts
  )
);

export function DeferredInsightsTrendCharts(
  props: InsightsTrendChartsProps
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || shouldLoad) return;
    const Observer = globalThis.IntersectionObserver;
    if (typeof Observer !== "function") {
      const timer = globalThis.setTimeout(() => setShouldLoad(true), 0);
      return () => globalThis.clearTimeout(timer);
    }

    const observer = new Observer(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "240px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={containerRef}>
      {shouldLoad ? (
        <InsightsTrendCharts {...props} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2" aria-hidden>
          <Skeleton className="h-[320px] rounded-xl" />
          <Skeleton className="h-[320px] rounded-xl" />
        </div>
      )}
    </div>
  );
}
