"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Screen } from "@/components/patterns/screen";
import {
  WealthItemDetail,
  type DetailMovement,
} from "@/components/wealth/wealth-item-detail";
import { useWealthAccounts } from "@/hooks/use-wealth-accounts";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

const MOVEMENT_LABELS: Record<string, { en: string; es: string }> = {
  opening_balance: { en: "Opening balance", es: "Saldo inicial" },
  transfer_in: { en: "Transfer in", es: "Entrada" },
  transfer_out: { en: "Transfer out", es: "Salida" },
  adjustment: { en: "Adjustment", es: "Ajuste" },
};

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useLocale();
  const router = useRouter();
  const { accounts, loading, archiveAccount } = useWealthAccounts();

  const account = accounts.find((item) => item.id === id);

  if (loading) {
    return (
      <Screen title={t("Account", "Cuenta")} backHref="/wealth/accounts">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-48 rounded-xl" />
      </Screen>
    );
  }

  if (!account) {
    return (
      <Screen title={t("Account", "Cuenta")} backHref="/wealth/accounts">
        <p className="py-10 text-center text-body text-muted-foreground">
          {t("This account no longer exists.", "Esta cuenta ya no existe.")}
        </p>
      </Screen>
    );
  }

  const movements: DetailMovement[] = account.movements.map((movement) => {
    const label = MOVEMENT_LABELS[movement.movement_type];
    return {
      id: movement.id,
      label: label ? t(label.en, label.es) : movement.movement_type,
      detail: movement.note ?? undefined,
      amount: Number(movement.amount),
      currency: movement.currency,
      date: movement.occurred_on,
    };
  });

  return (
    <WealthItemDetail
      title={account.name}
      breadcrumb={t("Accounts", "Cuentas")}
      backHref="/wealth/accounts"
      eyebrow={t("Current balance", "Saldo actual")}
      amount={account.balanceBase}
      icon={Wallet}
      archived={account.status !== "active"}
      stats={[
        {
          label: t("Opening", "Inicial"),
          value: formatCurrency(
            Number(account.opening_balance),
            account.currency
          ),
        },
        {
          label: t("Movements", "Movimientos"),
          value: String(account.movements.length),
        },
        {
          label: t("Spendable", "Disponible"),
          value: account.include_in_available ? t("Yes", "Sí") : t("No", "No"),
        },
      ]}
      movements={movements}
      onArchive={async () => {
        await archiveAccount.mutateAsync(account.id);
        toast.success(t("Account archived", "Cuenta archivada"));
        router.push("/wealth/accounts");
      }}
    />
  );
}
