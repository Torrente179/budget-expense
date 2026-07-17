import { Suspense } from "react";
import { MovementsScreen } from "@/components/movements/movements-screen";

export default function MovementsPage() {
  return (
    <Suspense>
      <MovementsScreen />
    </Suspense>
  );
}
