"use client";

import { useState } from "react";
import { ArrowRightLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SavingsTransferForm } from "@/components/wealth/savings-transfer-form";
import { buildSavingsAccountLabel, type InvestmentSavingsTransferWithJoins } from "@/lib/investments";
import type { InvestmentSavingsTransferFormValues } from "@/lib/validations";
import { useLocale } from "@/providers/locale-provider";
import type { InvestmentSavingsAccountRow } from "@/lib/investments";

interface SavingsTransferTableProps {
  transfers: InvestmentSavingsTransferWithJoins[];
  accounts: InvestmentSavingsAccountRow[];
  loading: boolean;
  onUpdate: (id: string, values: InvestmentSavingsTransferFormValues) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function SavingsTransferTable({
  transfers,
  accounts,
  loading,
  onUpdate,
  onDelete,
}: SavingsTransferTableProps) {
  const { t } = useLocale();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await onDelete(deleteId);
    setDeleting(false);
    setDeleteId(null);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[126px] animate-pulse rounded-xl border border-border/60 bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <EmptyState
        icon={ArrowRightLeft}
        title={t("No investment movements yet", "Aun no hay movimientos de inversion")}
        description={t(
          "Track transfers from your main balance into each savings account.",
          "Registra transferencias desde tu balance principal hacia cada cuenta de ahorro."
        )}
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {transfers.map((transfer) => (
          <div
            key={transfer.id}
            className="rounded-xl border bg-card p-4 shadow-1"
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-info/20 bg-info-subtle px-2.5 py-1 text-xs font-medium uppercase tracking-widest text-info">
                    {t("transfer", "transferencia")}
                  </span>
                  {transfer.source_kind === "expense_flow" ? (
                    <span className="rounded-full border border-success/20 bg-success-subtle px-2.5 py-1 text-xs font-medium uppercase tracking-widest text-success">
                      {t("from expenses", "desde gastos")}
                    </span>
                  ) : null}
                </div>
                <p className="text-base font-medium text-foreground">
                  {buildSavingsAccountLabel({
                    bankName: transfer.investment_savings_accounts.bank_name,
                    productName: transfer.investment_savings_accounts.product_name,
                    accountName: transfer.investment_savings_accounts.account_name,
                  })}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(transfer.transfer_date, "MMM d, yyyy")}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-flex" />
                  <span>{transfer.currency}</span>
                </div>
                {transfer.notes ? (
                  <p className="text-sm text-muted-foreground">{transfer.notes}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                <CurrencyDisplay
                  amount={Number(transfer.amount)}
                  currency={transfer.currency}
                  showOriginal
                  className="font-heading text-title font-semibold leading-none tracking-tight"
                />
                <div className="flex items-center gap-1">
                  <SavingsTransferForm
                    accounts={accounts}
                    defaultValues={{
                      savings_account_id: transfer.savings_account_id,
                      transfer_date: transfer.transfer_date,
                      amount: Number(transfer.amount),
                      currency: transfer.currency,
                      notes: transfer.notes ?? "",
                      source_kind: transfer.source_kind as "manual" | "expense_flow",
                    }}
                    onSubmit={(values) => onUpdate(transfer.id, values)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-2xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteId(transfer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl border-border/70 bg-popover/96 p-5">
          <DialogHeader className="space-y-3">
            <DialogTitle>
              {t("Delete investment movement", "Eliminar movimiento de inversion")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "This removes the transfer from savings-account balances and investment tracking.",
                "Esto elimina la transferencia del saldo de la cuenta de ahorro y del tracking de inversiones."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-[1.35rem] border-t border-border/60 bg-secondary/45 p-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              {t("Cancel", "Cancelar")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {t("Delete", "Eliminar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
