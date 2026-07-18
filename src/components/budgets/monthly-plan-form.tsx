"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
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
import { CircleDollarSign, Layers, Loader2, Sparkles } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

interface MonthlyPlanFormProps {
  month: number;
  year: number;
  onSubmit: (values: MonthlyBudgetPlanFormValues) => Promise<unknown>;
  defaultValues?: Partial<MonthlyBudgetPlanFormValues>;
  trigger?: React.ReactNode;
  /** When a budgeting method is applied, auto-open and show the method info */
  appliedMethodId?: string | null;
  onMethodConsumed?: () => void;
  /** Remove the saved monthly plan for this month. */
  onDelete?: () => Promise<unknown>;
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
}: MonthlyPlanFormProps) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { baseCurrency } = useCurrency();
  const hasExistingPlan = Boolean(defaultValues?.income_amount);

  /* When a budgeting method is applied externally, auto-open the form */
  const appliedMethod = useMemo(
    () => (appliedMethodId ? getBudgetingMethodById(locale, appliedMethodId) : null),
    [appliedMethodId, locale]
  );

  useEffect(() => {
    if (appliedMethod) {
      setOpen(true);
      /* The total allocation % from the method serves as a suggested allocation */
      const totalAlloc = appliedMethod.slices.reduce((sum, s) => sum + s.percent, 0);
      form.setValue("allocation_percent", totalAlloc);
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
      allocation_percent: defaultValues?.allocation_percent ?? 20,
      month,
      year,
    },
  });

  const incomeAmount = Number(form.watch("income_amount")) || 0;
  const allocationPercent = Number(form.watch("allocation_percent")) || 0;
  const incomeCurrency = form.watch("income_currency");

  const poolPreview = useMemo(
    () => incomeAmount * (allocationPercent / 100),
    [incomeAmount, allocationPercent]
  );

  async function handleSubmit(values: MonthlyBudgetPlanFormValues) {
    setSubmitting(true);
    const error = await onSubmit({ ...values, month, year });
    setSubmitting(false);

    if (!error) {
      setOpen(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    const error = await onDelete();
    setDeleting(false);
    if (!error) {
      setConfirmDelete(false);
      setOpen(false);
    }
  }

  return (
    <>
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger render={trigger as React.ReactElement} />
      ) : (
        <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
          <CircleDollarSign className="h-4 w-4" />
          <span className="hidden md:inline">{t("Set monthly plan", "Definir plan mensual")}</span>
        </SheetTrigger>
      )}

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
                    ? t("Refine monthly plan", "Refinar plan mensual")
                    : t("Set monthly plan", "Definir plan mensual")}
                </SheetTitle>
                <SheetDescription>
                  {t(
                    "Start with your monthly income and define the stewardship pool you want to protect first.",
                    "Comienza con tu ingreso mensual y define primero el fondo de mayordomía que deseas proteger."
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div className="rounded-xl border border-border/70 bg-card/90 p-4">
              <p className="text-label font-medium uppercase tracking-widest text-muted-foreground">
                {t("Monthly pool preview", "Vista previa del fondo mensual")}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="font-heading text-display font-semibold leading-none tracking-tight text-foreground">
                    {poolPreview > 0
                      ? formatCurrency(poolPreview, incomeCurrency)
                      : "--"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {allocationPercent || 0}% of{" "}
                    {incomeAmount > 0
                      ? formatCurrency(incomeAmount, incomeCurrency)
                      : t("your income", "tu ingreso")}
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
                  {t("Monthly income", "Ingreso mensual")}
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
                  {t("Income currency", "Moneda del ingreso")}
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

            <div className="space-y-2">
              <Label htmlFor="allocation-percent">
                {t("Protected budget %", "% de presupuesto protegido")}
              </Label>
              <Input
                id="allocation-percent"
                type="number"
                step="1"
                min="1"
                max="100"
                placeholder="20"
                className="font-mono"
                {...form.register("allocation_percent")}
              />
              <p className="text-sm text-muted-foreground">
                {t(
                  "Use 20% as the default target, then adjust the percentage when you need a tighter or wider pool for the month.",
                  "Usa 20% como objetivo inicial y luego ajusta el porcentaje cuando el mes necesite un fondo más ajustado o más amplio."
                )}
              </p>
              {form.formState.errors.allocation_percent && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.allocation_percent.message}
                </p>
              )}
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
                "Category budgets remain optional. When you set them, they work as envelopes inside this monthly pool instead of replacing it.",
                "Los presupuestos por categoría son opcionales. Cuando los defines, funcionan como sobres dentro de este fondo mensual en lugar de reemplazarlo."
              )}
            </div>
          </div>

          <SheetFooter className="border-t border-border/70 bg-background/92 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            {hasExistingPlan && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="justify-self-start text-danger hover:bg-danger-subtle hover:text-danger"
                onClick={() => setConfirmDelete(true)}
                disabled={submitting || deleting}
              >
                {t("Delete plan", "Eliminar plan")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {t("Cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={submitting || deleting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hasExistingPlan
                  ? t("Save plan", "Guardar plan")
                  : t("Create plan", "Crear plan")}
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
            {t("Delete monthly plan?", "¿Eliminar plan mensual?")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "This removes this month’s income and allocation. Your expenses and objectives stay — you can set a new plan anytime.",
              "Esto quita el ingreso y la asignación de este mes. Tus gastos y objetivos se quedan — puedes definir un plan nuevo cuando quieras."
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
