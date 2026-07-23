"use client";

import { Suspense } from "react";
import { CalendarScreen } from "@/components/insights/calendar-screen";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-xl" />}>
      <CalendarScreen />
    </Suspense>
  );
}
