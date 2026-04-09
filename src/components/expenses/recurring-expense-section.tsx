"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, Repeat, Trash2 } from "lucide-react";
import { useRecurringExpenses } from "@/hooks/use-recurring-expenses";
import { useLocale } from "@/providers/locale-provider";
import { formatDate } from "@/lib/utils";
import { CategoryBadge } from "@/components/shared/category-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecurringExpenseForm } from "./recurring-expense-form";
import type { RecurringExpenseFormValues } from "@/lib/validations";

interface RecurringExpenseSectionProps {
  month: number;
  year: number;
  onChanged?: () => Promise<unknown> | void;
}

function getMonthlyDebitDate(month: number, year: number, chargeDay: number) {
  const debitDay = Math.min(chargeDay, new Date(year, month, 0).getDate());
  return `${year}-${String(month).padStart(2, "0")}-${String(debitDay).padStart(2, "0")}`;
}

export function RecurringExpenseSection({
  month,
  year,
  onChanged,
}: RecurringExpenseSectionProps) {
  const { t, tc } = useLocale();
  const {
    recurringExpenses,
    loading,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
  } = useRecurringExpenses();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const deletingItem = useMemo(
    () => recurringExpenses.find((item) => item.id === deleteId) ?? null,
    [deleteId, recurringExpenses]
  );

  async function notifyChanged() {
    await onChanged?.();
  }

  async function handleCreate(values: RecurringExpenseFormValues) {
    const error = await addRecurringExpense(values);
    if (!error) {
      await notifyChanged();
    }
    return error;
  }

  async function handleUpdate(
    id: string,
    values: RecurringExpenseFormValues
  ) {
    const error = await updateRecurringExpense(id, values);
    if (!error) {
      await notifyChanged();
    }
    return error;
  }

  async function handleToggle(id: string, checked: boolean) {
    setUpdatingId(id);
    const error = await updateRecurringExpense(id, { is_active: checked });
    setUpdatingId(null);

    if (!error) {
      await notifyChanged();
    }
  }

  async function handleDelete() {
    if (!deleteId) {
      return;
    }

    setDeleting(true);
    const error = await deleteRecurringExpense(deleteId);
    setDeleting(false);

    if (!error) {
      setDeleteId(null);
      await notifyChanged();
    }
  }

  return (
    <>
      <section className="space-y-3 rounded-[1.75rem] border border-border/70 bg-card/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              {t("Monthly automations", "Automatizaciones mensuales")}
            </p>
            <h2 className="mt-1 text-base font-medium">
              {t("Recurring charges", "Cargos recurrentes")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "Define fixed expenses once and they are posted automatically every month.",
                "Define gastos fijos una vez y se registran automáticamente cada mes."
              )}
            </p>
          </div>
          <RecurringExpenseForm onSubmit={handleCreate} />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-[1.2rem] border border-border/60 bg-muted/50"
              />
            ))}
          </div>
        ) : recurringExpenses.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title={t("No recurring charges yet", "Aún no hay cargos recurrentes")}
            description={t(
              "Add at least one fixed monthly charge to keep your month-to-month debits consistent.",
              "Agrega al menos un cargo fijo mensual para mantener consistentes tus débitos mes a mes."
            )}
          />
        ) : (
          <div className="space-y-2">
            {recurringExpenses.map((recurringExpense) => {
              const thisMonthDebitDate = getMonthlyDebitDate(
                month,
                year,
                recurringExpense.charge_day
              );
              const startsThisMonth =
                recurringExpense.start_date <= thisMonthDebitDate;

              return (
                <div
                  key={recurringExpense.id}
                  className="rounded-[1.2rem] border border-border/70 bg-background/55 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <p className="truncate text-sm font-medium">
                        {recurringExpense.description ||
                          tc(recurringExpense.categories.name)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <CategoryBadge
                          name={tc(recurringExpense.categories.name)}
                          icon={recurringExpense.categories.icon}
                          color={recurringExpense.categories.color}
                          size="md"
                          className="rounded-xl px-2.5 py-1"
                        />
                        <span>
                          {t(
                            `Debits day ${recurringExpense.charge_day} monthly`,
                            `Debita día ${recurringExpense.charge_day} cada mes`
                          )}
                        </span>
                        <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-flex" />
                        <span className="hidden sm:inline-flex">
                          {startsThisMonth
                            ? t(
                                `This period: ${formatDate(thisMonthDebitDate, "MMM d, yyyy")}`,
                                `Este período: ${formatDate(thisMonthDebitDate, "d 'de' MMM, yyyy")}`
                              )
                            : t(
                                `Starts ${formatDate(recurringExpense.start_date, "MMM d, yyyy")}`,
                                `Empieza ${formatDate(recurringExpense.start_date, "d 'de' MMM, yyyy")}`
                              )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CurrencyDisplay
                        amount={recurringExpense.amount}
                        currency={recurringExpense.currency}
                        className="font-heading text-[1.3rem] font-semibold leading-none tracking-[-0.03em]"
                        showOriginal
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={recurringExpense.is_active}
                        disabled={updatingId === recurringExpense.id}
                        onCheckedChange={(checked) =>
                          handleToggle(recurringExpense.id, checked)
                        }
                      />
                      <span>
                        {recurringExpense.is_active
                          ? t("Active", "Activo")
                          : t("Paused", "Pausado")}
                      </span>
                      {updatingId === recurringExpense.id && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <RecurringExpenseForm
                        defaultValues={{
                          amount: recurringExpense.amount,
                          currency: recurringExpense.currency,
                          category_id: recurringExpense.category_id,
                          description: recurringExpense.description ?? "",
                          charge_day: recurringExpense.charge_day,
                          start_date: recurringExpense.start_date,
                          is_active: recurringExpense.is_active,
                        }}
                        onSubmit={(values) =>
                          handleUpdate(recurringExpense.id, values)
                        }
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
                        onClick={() => setDeleteId(recurringExpense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[380px] rounded-[1.75rem] border-border/70 bg-popover/96 p-5">
          <DialogHeader className="space-y-3">
            <DialogTitle>
              {t("Delete recurring charge", "Eliminar cargo recurrente")}
            </DialogTitle>
            <DialogDescription>
              {deletingItem
                ? t(
                    `Future automatic debits for "${deletingItem.description || tc(deletingItem.categories.name)}" will stop.`,
                    `Los débitos automáticos futuros para "${deletingItem.description || tc(deletingItem.categories.name)}" se detendrán.`
                  )
                : t(
                    "Future automatic debits from this rule will stop.",
                    "Los débitos automáticos futuros de esta regla se detendrán."
                  )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-[1.35rem] border-t border-border/60 bg-secondary/45 p-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              {t("Cancel", "Cancelar")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {t("Delete", "Eliminar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
