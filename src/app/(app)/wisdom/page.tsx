"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const WisdomScreen = dynamic(
  () =>
    import("@/components/wisdom/wisdom-screen").then((mod) => mod.WisdomScreen),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 pt-6">
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    ),
  }
);

export default function WisdomPage() {
  return <WisdomScreen />;
}
