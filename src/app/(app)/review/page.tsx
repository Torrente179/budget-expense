"use client";

import { Screen } from "@/components/patterns/screen";
import { ReviewFlow } from "@/components/review/review-flow";
import { useLocale } from "@/providers/locale-provider";

export default function ReviewPage() {
  const { t } = useLocale();

  return (
    <Screen
      title={t("Weekly review", "Revisión semanal")}
      eyebrow={t("Two minutes", "Dos minutos")}
      backHref="/home"
      mode="chrome-sheet"
    >
      <div className="w-full max-w-3xl md:mx-auto">
        <ReviewFlow />
      </div>
    </Screen>
  );
}
