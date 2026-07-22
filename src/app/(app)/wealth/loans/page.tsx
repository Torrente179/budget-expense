"use client";

import { Screen } from "@/components/patterns/screen";
import { WealthNav } from "@/components/wealth/wealth-nav";
import { LoansEditor } from "@/components/wealth/loans-editor";
import { useLocale } from "@/providers/locale-provider";

export default function LoansPage() {
  const { t } = useLocale();

  return (
    <Screen
      title={t("Loans", "Préstamos")}
      backHref="/wealth"
      subheader={<WealthNav />}
    >
      <LoansEditor />
    </Screen>
  );
}
