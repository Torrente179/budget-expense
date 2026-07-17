"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const InsightsScreen = dynamic(
  () =>
    import("@/components/insights/insights-screen").then(
      (mod) => mod.InsightsScreen
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 pt-6">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    ),
  }
);

export default function InsightsPage() {
  return <InsightsScreen />;
}
