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
    >
      <div className="mx-auto w-full max-w-2xl">
        <ReviewFlow />
      </div>
    </Screen>
  );
}
