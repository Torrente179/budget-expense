"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Database } from "@/types/database";
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
import { IncomeForm } from "./income-form";
import { useLocale } from "@/providers/locale-provider";

type Income = Database["public"]["Tables"]["income_entries"]["Row"];

interface IncomeTableProps {
  incomes: Income[];
  loading: boolean;
  onUpdate: (
    id: string,
    data: Database["public"]["Tables"]["income_entries"]["Update"]
  ) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function IncomeTable({ incomes, loading, onUpdate, onDelete }: IncomeTableProps) {
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
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[132px] animate-pulse rounded-[1.5rem] border border-border/60 bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (incomes.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title={t("No income entries yet", "Aún no hay ingresos")}
        description={t(
          "Add your first income to keep your available total updated.",
          "Agrega tu primer ingreso para mantener actualizado tu total disponible."
        )}
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {incomes.map((income, index) => (
          <motion.div
            key={income.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="group rounded-[1.5rem] border border-border/80 bg-card/96 p-4 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.84)] transition-colors duration-200 hover:bg-secondary/35"
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-foreground">{income.source}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(income.date, "MMM d, yyyy")}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-flex" />
                  <span className="hidden sm:inline-flex">{income.currency}</span>
                </div>
                {income.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{income.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:text-right">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-lg font-semibold text-emerald-300">+</span>
                  <CurrencyDisplay
                    amount={income.amount}
                    currency={income.currency}
                    className="font-heading text-[1.45rem] font-semibold leading-none tracking-[-0.04em] text-emerald-300"
                    showOriginal
                  />
                </div>

                <div className="flex items-center gap-1">
                  <IncomeForm
                    defaultValues={{
                      amount: income.amount,
                      currency: income.currency,
                      source: income.source,
                      description: income.description ?? "",
                      date: income.date,
                    }}
                    onSubmit={async (values) => onUpdate(income.id, values)}
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
                    onClick={() => setDeleteId(income.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[380px] rounded-[1.75rem] border-border/70 bg-popover/96 p-5">
          <DialogHeader className="space-y-3">
            <DialogTitle>{t("Delete income", "Eliminar ingreso")}</DialogTitle>
            <DialogDescription>
              {t(
                "This movement will be removed from your income history and monthly balance.",
                "Este movimiento se eliminará de tu historial de ingresos y del balance mensual."
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
