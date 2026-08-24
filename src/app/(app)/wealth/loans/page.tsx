"use client";

import { Screen } from "@/components/patterns/screen";
import { WealthBreadcrumb } from "@/components/wealth/wealth-breadcrumb";
import { LoansEditor } from "@/components/wealth/loans-editor";
import { useLocale } from "@/providers/locale-provider";

export default function LoansPage() {
  const { t } = useLocale();

  return (
    <Screen
      title={t("Loans", "Préstamos")}
      backHref="/wealth"
      mode="chrome-sheet"
      subheader={<WealthBreadcrumb current={t("Loans", "Préstamos")} />}
    >
      <LoansEditor />
    </Screen>
  );
}
