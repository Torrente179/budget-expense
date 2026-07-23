"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MONTHLY_PLAN_FULL_ALLOCATION,
  monthlyBudgetPlanSchema,
  type MonthlyBudgetPlanFormValues,
} from "@/lib/validations";
import { getBudgetingMethodById } from "@/lib/budgeting-methods";
import { useCurrency } from "@/providers/currency-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatCurrency } from "@/lib/utils";
import { CURRENCIES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircleDollarSign, Layers, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

interface MonthlyPlanFormProps {
  month: number;
  year: number;
  onSubmit: (
    values: MonthlyBudgetPlanFormValues & { allocation_percent: number }
  ) => Promise<unknown>;
  defaultValues?: Partial<MonthlyBudgetPlanFormValues>;
  trigger?: React.ReactNode;
  /** When a budgeting method is applied, auto-open and show the method info */
  appliedMethodId?: string | null;
  onMethodConsumed?: () => void;
  /** Remove the saved monthly plan for this month. */
  onDelete?: () => Promise<unknown>;
  /** Allows the lightweight page shell to mount this form only after intent. */
  controlledOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MonthlyPlanForm({
  month,
  year,
  onSubmit,
  defaultValues,
  trigger,
  appliedMethodId,
  onMethodConsumed,
  onDelete,
  controlledOpen,
  onOpenChange,
}: MonthlyPlanFormProps) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const resolvedOpen = isControlled ? controlledOpen : open;
  const setResolvedOpen = isControlled
    ? (value: boolean) => onOpenChange?.(value)
    : setOpen;
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { baseCurrency } = useCurrency();
  const hasExistingPlan = Boolean(defaultValues?.income_amount);

  const appliedMethod = useMemo(
    () => (appliedMethodId ? getBudgetingMethodById(locale, appliedMethodId) : null),
    [appliedMethodId, locale]
  );

  useEffect(() => {
    if (appliedMethod) {
      setResolvedOpen(true);
      onMethodConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedMethod]);

  const form = useForm<MonthlyBudgetPlanFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(monthlyBudgetPlanSchema) as any,
    defaultValues: {
      income_amount:
        defaultValues?.income_amount ?? (undefined as unknown as number),
      income_currency: defaultValues?.income_currency ?? baseCurrency,
      month,
      year,
    },
  });

  /* Keep fields in sync when reopening the sheet after create/edit/delete. */
  useEffect(() => {
    if (!resolvedOpen) return;
    form.reset({
      income_amount:
        defaultValues?.income_amount ?? (undefined as unknown as number),
      income_currency: defaultValues?.income_currency ?? baseCurrency,
      month,
      year,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    resolvedOpen,
    defaultValues?.income_amount,
    defaultValues?.income_currency,
    month,
    year,
    baseCurrency,
  ]);

  const incomeAmount = Number(form.watch("income_amount")) || 0;
  const incomeCurrency = form.watch("income_currency");

  async function handleSubmit(values: MonthlyBudgetPlanFormValues) {
    setSubmitting(true);
    const error = await onSubmit({
      ...values,
      month,
      year,
      allocation_percent: MONTHLY_PLAN_FULL_ALLOCATION,
    });
    setSubmitting(false);

    if (!error) {
      setResolvedOpen(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    const error = await onDelete();
    setDeleting(false);
    if (!error) {
      setConfirmDelete(false);
      setResolvedOpen(false);
    }
  }

  return (
    <>
    <Sheet open={resolvedOpen} onOpenChange={setResolvedOpen}>
      {trigger ? (
        <SheetTrigger render={trigger as React.ReactElement} />
      ) : !isControlled ? (
        <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
          <CircleDollarSign className="h-4 w-4" />
          <span className="hidden md:inline">{t("Set monthly plan", "Definir plan mensual")}</span>
        </SheetTrigger>
      ) : null}

      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full border-l border-border/80 bg-popover/96 p-0 shadow-3 sm:max-w-[460px] data-[side=bottom]:max-h-[88vh] data-[side=bottom]:rounded-t-3xl data-[side=bottom]:border-x data-[side=bottom]:border-t"
      >
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex h-full flex-col"
        >
          <SheetHeader className="border-b border-border/70 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <SheetTitle>
                  {defaultValues?.income_amount
                    ? t("Refine monthly income", "Refinar ingreso mensual")
                    : t("Set monthly income", "Definir ingreso mensual")}
                </SheetTitle>
                <SheetDescription>
                  {t(
                    "Set the income you expect this month. Budgets and methods use this amount to resolve percentages.",
                    "Define el ingreso que esperas este mes. Los presupuestos y métodos usan este monto para calcular los porcentajes."
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div className="rounded-xl border border-border/70 bg-card/90 p-4">
              <p className="text-label font-medium uppercase tracking-widest text-muted-foreground">
                {t("Monthly income", "Ingreso mensual")}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="font-heading text-display font-semibold leading-none tracking-tight text-foreground">
                    {incomeAmount > 0
                      ? formatCurrency(incomeAmount, incomeCurrency)
                      : "--"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(
                      "Base for percentage budgets this month",
                      "Base de los presupuestos en % este mes"
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/70 px-3 py-2 text-right">
                  <p className="label-caps">
                    {t("Period", "Periodo")}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {month.toString().padStart(2, "0")}/{year}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="income-amount">
                  {t("Amount", "Monto")}
                </Label>
                <Input
                  id="income-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="font-mono"
                  {...form.register("income_amount")}
                />
                {form.formState.errors.income_amount && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.income_amount.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-currency">
                  {t("Currency", "Moneda")}
                </Label>
                <Select
                  value={form.watch("income_currency")}
                  onValueChange={(value) =>
                    value && form.setValue("income_currency", value)
                  }
                >
                  <SelectTrigger
                    id="income-currency"
                    className="font-mono text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem
                        key={currency.code}
                        value={currency.code}
                        className="text-sm"
                      >
                        {currency.flag} {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {appliedMethod && (
              <div className="rounded-xl border border-warning/25 bg-warning-subtle p-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-warning" />
                  <p className="text-sm font-medium text-foreground">
                    {t("Method applied", "Método aplicado")}: {appliedMethod.name}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {appliedMethod.tagline}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {appliedMethod.slices.map((s) => (
                    <Badge
                      key={s.key}
                      variant="outline"
                      className="bg-secondary/50 text-xs"
                    >
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label} {s.percent}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border/70 bg-secondary/60 p-4 text-sm text-muted-foreground">
              {t(
                "Named budgets on the Budget tab track groups of categories against this month's income.",
                "Los presupuestos con nombre en la pestaña Presupuesto siguen grupos de categorías frente al ingreso del mes."
              )}
            </div>
          </div>

          {hasExistingPlan && onDelete ? (
            <div className="border-t border-border/70 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-danger/30 text-danger hover:bg-danger-subtle hover:text-danger"
                onClick={() => setConfirmDelete(true)}
                disabled={submitting || deleting}
              >
                <Trash2 className="h-4 w-4" />
                {t("Delete this month's income", "Eliminar ingreso de este mes")}
              </Button>
            </div>
          ) : null}

          <SheetFooter className="border-t border-border/70 bg-background/92 px-5 py-4 sm:flex-row sm:justify-end">
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setResolvedOpen(false)}
              >
                {t("Cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={submitting || deleting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save income", "Guardar ingreso")}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("Delete monthly income?", "¿Eliminar ingreso mensual?")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "This removes this month’s planned income. Your expenses and budgets stay — you can set a new income anytime.",
              "Esto quita el ingreso previsto de este mes. Tus gastos y presupuestos se quedan — puedes definir un ingreso nuevo cuando quieras."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setConfirmDelete(false)}
            disabled={deleting}
          >
            {t("Cancel", "Cancelar")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("Delete plan", "Eliminar plan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
