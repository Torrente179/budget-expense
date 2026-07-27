"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HandCoins } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Screen } from "@/components/patterns/screen";
import {
  WealthItemDetail,
  type DetailMovement,
} from "@/components/wealth/wealth-item-detail";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import type { Database } from "@/types/database";

type Loan = Database["public"]["Tables"]["loans"]["Row"];
type LoanRepayment = Database["public"]["Tables"]["loan_repayments"]["Row"];

export default function LoanDetailPage({
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
    queryKey: queryKeys.loans,
    queryFn: () =>
      authorizedFetch<{ loans: Loan[]; repayments: LoanRepayment[] }>(
        "/api/loans"
      ),
  });

  /**
   * Closing a receivable sets `is_active = false` rather than deleting it. The
   * repayments are real ledger history; removing the loan would orphan them
   * and change what past months looked like.
   */
  const closeLoan = useMutation({
    mutationFn: () =>
      authorizedFetch(`/api/loans/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: false }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.loans }),
  });

  if (isPending) {
    return (
      <Screen title={t("Loan", "Préstamo")} backHref="/wealth/loans">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-48 rounded-xl" />
      </Screen>
    );
  }

  const loan = data?.loans.find((entry) => entry.id === id);

  if (!loan) {
    return (
      <Screen title={t("Loan", "Préstamo")} backHref="/wealth/loans">
        <p className="py-10 text-center text-body text-muted-foreground">
          {t("This loan no longer exists.", "Este préstamo ya no existe.")}
        </p>
      </Screen>
    );
  }

  const repayments = (data?.repayments ?? []).filter(
    (entry) => entry.loan_id === id
  );
  const repaid = repayments.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0
  );
  const outstanding = Math.max(Number(loan.principal) - repaid, 0);

  const movements: DetailMovement[] = repayments.map((entry) => ({
    id: entry.id,
    label: t("Payment received", "Cobro recibido"),
    detail: entry.note ?? undefined,
    // Repayments arrive as money in — recovered principal, not income.
    amount: Number(entry.amount),
    currency: entry.currency,
    date: entry.repayment_date,
  }));

  return (
    <WealthItemDetail
      title={loan.borrower_name}
      breadcrumb={t("Money lent", "Dinero prestado")}
      backHref="/wealth/loans"
      eyebrow={t("Still to collect", "Pendiente por cobrar")}
      amount={convert(outstanding, loan.currency)}
      icon={HandCoins}
      archived={!loan.is_active}
      progress={
        Number(loan.principal) > 0
          ? {
              ratio: repaid / Number(loan.principal),
              label: t("Recovered", "Recuperado"),
            }
          : null
      }
      stats={[
        {
          label: t("Lent", "Prestado"),
          value: formatCurrency(Number(loan.principal), loan.currency),
        },
        {
          label: t("Recovered", "Recuperado"),
          value: formatCurrency(repaid, loan.currency),
          tone: "positive",
        },
        {
          label: t("Payments", "Cobros"),
          value: String(repayments.length),
        },
      ]}
      movements={movements}
      onArchive={
        loan.is_active
          ? async () => {
              await closeLoan.mutateAsync();
              toast.success(t("Loan closed", "Préstamo cerrado"));
              router.push("/wealth/loans");
            }
          : undefined
      }
    />
  );
}
