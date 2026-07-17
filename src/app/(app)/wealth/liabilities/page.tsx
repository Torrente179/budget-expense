"use client";

import { Screen } from "@/components/patterns/screen";
import { WealthNav } from "@/components/wealth/wealth-nav";
import { LiabilitiesEditor } from "@/components/wealth/liabilities-editor";
import { useLocale } from "@/providers/locale-provider";

export default function LiabilitiesPage() {
  const { t } = useLocale();

  return (
    <Screen
      title={t("Debts", "Deudas")}
      backHref="/wealth"
      subheader={<WealthNav />}
    >
      <LiabilitiesEditor />
    </Screen>
  );
}
