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
import { CashMovementForm } from "@/components/wealth/cash-movement-form";
import type { InvestmentCashMovementWithJoins } from "@/lib/investments";
import type { InvestmentCashMovementFormValues } from "@/lib/validations";
import { StatusTag } from "@/components/patterns/status-tag";
import { useLocale } from "@/providers/locale-provider";

interface BrokerageAccountOption {
  id: string;
  broker_kind: string;
  name: string;
  account_currency: string;
  fee_currency: string;
}

interface CashMovementTableProps {
  cashMovements: InvestmentCashMovementWithJoins[];
  accounts: BrokerageAccountOption[];
  loading: boolean;
  onUpdate: (
    id: string,
    values: InvestmentCashMovementFormValues
  ) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function CashMovementTable({
  cashMovements,
  accounts,
  loading,
  onUpdate,
  onDelete,
}: CashMovementTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { t } = useLocale();

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

  if (cashMovements.length === 0) {
    return (
      <EmptyState
        icon={ArrowRightLeft}
        title={t("No cash movements yet", "Aún no hay movimientos de caja")}
        description={t(
          "Track deposits and withdrawals separately from the expense ledger.",
          "Registra depósitos y retiros por separado del registro de gastos."
        )}
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {cashMovements.map((movement) => (
          <div
            key={movement.id}
            className="rounded-xl border bg-card p-4"
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusTag
                    tone={
                      movement.movement_type === "deposit" ? "success" : "info"
                    }
                  >
                    {movement.movement_type === "deposit"
                      ? t("Deposit", "Depósito")
                      : t("Withdrawal", "Retiro")}
                  </StatusTag>
                  <p className="text-base font-medium text-foreground">
                    {movement.brokerage_accounts.broker_kind}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(movement.movement_date, "MMM d, yyyy")}</span>
                  {movement.brokerage_accounts.name !==
                  movement.brokerage_accounts.broker_kind ? (
                    <>
                      <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-flex" />
                      <span>{movement.brokerage_accounts.name}</span>
                    </>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("Fee", "Comisión")} {Number(movement.fee_amount).toFixed(2)}{" "}
                  {movement.fee_currency}
                  {movement.notes ? ` · ${movement.notes}` : ""}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                <CurrencyDisplay
                  amount={Number(movement.amount)}
                  currency={movement.currency}
                  showOriginal
                  className="font-heading text-title font-semibold leading-none tracking-tight"
                />
                <div className="flex items-center gap-1">
                  <CashMovementForm
                    accounts={accounts}
                    defaultValues={{
                      account_id: movement.account_id,
                      broker_name: movement.brokerage_accounts.broker_kind,
                      movement_type: movement.movement_type as "deposit" | "withdrawal",
                      movement_date: movement.movement_date,
                      amount: Number(movement.amount),
                      currency: movement.currency,
                      fee_amount: Number(movement.fee_amount),
                      fee_currency: movement.fee_currency,
                      notes: movement.notes ?? "",
                    }}
                    onSubmit={(values) => onUpdate(movement.id, values)}
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
                    onClick={() => setDeleteId(movement.id)}
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
              {t("Delete cash movement", "Eliminar movimiento de caja")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "This removes the movement from contribution and account cash summaries.",
                "Esto elimina el movimiento de los resúmenes de aportes y caja de la cuenta."
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
