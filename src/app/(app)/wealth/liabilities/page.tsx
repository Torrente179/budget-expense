"use client";

import { Screen } from "@/components/patterns/screen";
import { WealthBreadcrumb } from "@/components/wealth/wealth-breadcrumb";
import { LiabilitiesEditor } from "@/components/wealth/liabilities-editor";
import { useLocale } from "@/providers/locale-provider";

export default function LiabilitiesPage() {
  const { t } = useLocale();

  return (
    <Screen
      title={t("Debts", "Deudas")}
      backHref="/wealth"
      mode="chrome-sheet"
      subheader={<WealthBreadcrumb current={t("Debts", "Deudas")} />}
    >
      <LiabilitiesEditor />
    </Screen>
  );
}
