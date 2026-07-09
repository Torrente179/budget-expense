"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ReviewFlow } from "@/components/review/review-flow";
import { useLocale } from "@/providers/locale-provider";

export default function ReviewPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={t("Weekly review", "Revisión semanal")}
        description={t(
          "Two minutes: categorize, notice, prepare.",
          "Dos minutos: categoriza, observa, prepárate."
        )}
      />
      <ReviewFlow />
    </div>
  );
}
