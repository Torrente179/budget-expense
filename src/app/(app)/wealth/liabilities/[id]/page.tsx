"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Screen } from "@/components/patterns/screen";
import {
  WealthItemDetail,
  type DetailMovement,
} from "@/components/wealth/wealth-item-detail";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import { liabilityKindLabel } from "@/lib/liability-kinds";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import type { Database } from "@/types/database";

type Liability = Database["public"]["Tables"]["liabilities"]["Row"];
type LiabilityPayment =
  Database["public"]["Tables"]["liability_payments"]["Row"];

export default function LiabilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useLocale();
  const { convert } = useCurrency();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: queryKeys.liabilities,
    queryFn: () =>
      authorizedFetch<{
        liabilities: Liability[];
        payments: LiabilityPayment[];
      }>("/api/liabilities"),
  });

  /**
   * Settling a debt deactivates it. Payments are ledger history — deleting the
   * liability would orphan them and rewrite what past months looked like.
   */
  const closeLiability = useMutation({
    mutationFn: () =>
      authorizedFetch(`/api/liabilities/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: false }),
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.liabilities }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.householdInsights,
        }),
      ]),
  });

  if (isPending) {
    return (
      <Screen title={t("Debt", "Deuda")} backHref="/wealth/liabilities">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-48 rounded-xl" />
      </Screen>
    );
  }

  const liability = data?.liabilities.find((entry) => entry.id === id);

  if (!liability) {
    return (
      <Screen title={t("Debt", "Deuda")} backHref="/wealth/liabilities">
        <p className="py-10 text-center text-body text-muted-foreground">
          {t("This debt no longer exists.", "Esta deuda ya no existe.")}
        </p>
      </Screen>
    );
  }

  const payments = (data?.payments ?? []).filter(
    (entry) => entry.liability_id === id
  );
  const paid = payments.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const original = Number(liability.original_balance);
  const outstanding = Math.max(original - paid, 0);

  const movements: DetailMovement[] = payments.map((entry) => ({
    id: entry.id,
    // Amounts are signed: a negative payment is an upward balance adjustment.
    label:
      Number(entry.amount) >= 0
        ? t("Payment", "Pago")
        : t("Balance increase", "Aumento de saldo"),
    detail: entry.note ?? undefined,
    amount: Number(entry.amount),
    currency: entry.currency,
    date: entry.payment_date,
  }));

  return (
    <WealthItemDetail
      title={liability.name}
      breadcrumb={t("Debts", "Deudas")}
      backHref="/wealth/liabilities"
      eyebrow={t("Outstanding", "Pendiente")}
      amount={convert(outstanding, liability.currency)}
      icon={CreditCard}
      archived={!liability.is_active}
      progress={
        original > 0
          ? { ratio: paid / original, label: t("Paid off", "Pagado") }
          : null
      }
      stats={[
        {
          label: t("Original", "Importe original"),
          value: formatCurrency(original, liability.currency),
        },
        {
          label: t("Paid", "Pagado"),
          value: formatCurrency(paid, liability.currency),
          tone: "positive",
        },
        {
          label: t("Type", "Tipo"),
          value: liabilityKindLabel(liability.kind, t),
        },
      ]}
      movements={movements}
      onArchive={
        liability.is_active
          ? async () => {
              await closeLiability.mutateAsync();
              toast.success(t("Debt closed", "Deuda cerrada"));
              router.push("/wealth/liabilities");
            }
          : undefined
      }
    />
  );
}
