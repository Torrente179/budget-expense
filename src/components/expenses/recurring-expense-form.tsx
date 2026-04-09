"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Repeat } from "lucide-react";
import {
  recurringExpenseSchema,
  type RecurringExpenseFormValues,
} from "@/lib/validations";
import { CURRENCIES } from "@/lib/constants";
import { useCategories } from "@/hooks/use-categories";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { parseDecimalInput } from "@/lib/utils";

interface RecurringExpenseFormProps {
  onSubmit: (values: RecurringExpenseFormValues) => Promise<unknown>;
  defaultValues?: Partial<RecurringExpenseFormValues>;
  trigger?: React.ReactNode;
}

export function RecurringExpenseForm({
  onSubmit,
  defaultValues,
  trigger,
}: RecurringExpenseFormProps) {
  const { t, tc } = useLocale();
  const { baseCurrency } = useCurrency();
  const { categories } = useCategories();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const fallbackDebitDay = Math.max(1, Math.min(31, new Date().getDate()));

  const resolvedDefaults = useMemo(
    () => ({
      amount: defaultValues?.amount ?? (undefined as unknown as number),
      currency: defaultValues?.currency ?? baseCurrency,
      category_id: defaultValues?.category_id ?? "",
      description: defaultValues?.description ?? "",
      charge_day: defaultValues?.charge_day ?? fallbackDebitDay,
      start_date: defaultValues?.start_date ?? today,
      is_active: defaultValues?.is_active ?? true,
    }),
    [
      baseCurrency,
      defaultValues?.amount,
      defaultValues?.category_id,
      defaultValues?.charge_day,
      defaultValues?.currency,
      defaultValues?.description,
      defaultValues?.is_active,
      defaultValues?.start_date,
      fallbackDebitDay,
      today,
    ]
  );

  const form = useForm<RecurringExpenseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recurringExpenseSchema) as any,
    defaultValues: resolvedDefaults,
  });

  const currency = form.watch("currency");
  const categoryId = form.watch("category_id");
  const chargeDay = Number(form.watch("charge_day")) || fallbackDebitDay;
  const isActive = form.watch("is_active");
  const selectedCategory = categories.find((category) => category.id === categoryId);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (open) {
      form.reset(resolvedDefaults);
    }
  }, [open, form, resolvedDefaults]);

  async function handleSubmit(values: RecurringExpenseFormValues) {
    setSubmitting(true);
    const error = await onSubmit(values);
    setSubmitting(false);

    if (!error) {
      setOpen(false);
      form.reset(resolvedDefaults);
    }
  }

  const composerTitle = defaultValues?.amount
    ? t("Edit recurring charge", "Editar cargo recurrente")
    : t("Add recurring charge", "Agregar cargo recurrente");
  const composerDescription = defaultValues?.amount
    ? t(
        "Adjust this recurring rule while keeping future debits automatic.",
        "Ajusta esta regla recurrente manteniendo los débitos futuros automáticos."
      )
    : t(
        "Create fixed monthly debits so they post automatically every month.",
        "Crea débitos mensuales fijos para que se registren automáticamente cada mes."
      );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger render={trigger as React.ReactElement} />
      ) : (
        <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Repeat className="h-4 w-4" />
          {t("Recurring charge", "Cargo recurrente")}
        </SheetTrigger>
      )}

      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full overflow-hidden border-border/80 bg-popover/96 p-0 shadow-[0_34px_100px_-56px_rgba(0,0,0,0.95)] data-[side=bottom]:max-h-[90vh] data-[side=bottom]:rounded-t-[2rem] data-[side=bottom]:border-t sm:max-w-[540px] data-[side=right]:sm:max-w-[540px]"
      >
        <form className="flex h-full flex-col" onSubmit={form.handleSubmit(handleSubmit)}>
          <SheetHeader className="border-b border-border/70 bg-background/90 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-foreground">
                <Repeat className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <SheetTitle className="text-lg">{composerTitle}</SheetTitle>
                <SheetDescription>{composerDescription}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_150px]">
                  <div className="space-y-2">
                    <Label htmlFor="recurring-amount">{t("Amount", "Monto")}</Label>
                    <Input
                      id="recurring-amount"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      className="h-11 font-mono text-base"
                      {...form.register("amount", {
                        setValueAs: (value) => parseDecimalInput(value),
                      })}
                    />
                    {form.formState.errors.amount && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.amount.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurring-currency">{t("Currency", "Moneda")}</Label>
                    <Select
                      value={currency}
                      onValueChange={(value) =>
                        value &&
                        form.setValue("currency", value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger id="recurring-currency" className="h-11 font-mono text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((item) => (
                          <SelectItem key={item.code} value={item.code} className="text-sm">
                            {item.flag} {item.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t(
                    `Defaulting to your base currency ${baseCurrency}, but you can choose any source currency.`,
                    `Se usa tu moneda base ${baseCurrency} por defecto, pero puedes elegir cualquier moneda de origen.`
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-category">{t("Category", "Categoría")}</Label>
                <Select
                  value={categoryId}
                  onValueChange={(value) =>
                    value &&
                    form.setValue("category_id", value, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="recurring-category" className="h-11">
                    <SelectValue placeholder={t("Select category", "Selecciona categoría")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-sm">
                        {tc(category.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category_id && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.category_id.message}
                  </p>
                )}
                {selectedCategory && (
                  <p className="text-xs text-muted-foreground">
                    {t("Selected", "Seleccionada")}: {tc(selectedCategory.name)}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recurring-charge-day">
                    {t("Debit day", "Día de débito")}
                  </Label>
                  <Input
                    id="recurring-charge-day"
                    type="number"
                    min="1"
                    max="31"
                    className="h-11 font-mono"
                    {...form.register("charge_day")}
                  />
                  {form.formState.errors.charge_day && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.charge_day.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurring-start-date">
                    {t("Start date", "Fecha de inicio")}
                  </Label>
                  <Input
                    id="recurring-start-date"
                    type="date"
                    className="h-11"
                    {...form.register("start_date")}
                  />
                  {form.formState.errors.start_date && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.start_date.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-description">
                  {t("Description", "Descripción")}{" "}
                  <span className="text-muted-foreground">
                    ({t("optional", "opcional")})
                  </span>
                </Label>
                <Input
                  id="recurring-description"
                  className="h-11"
                  placeholder={t(
                    "Rent, subscriptions, utilities...",
                    "Renta, suscripciones, servicios..."
                  )}
                  {...form.register("description")}
                />
              </div>

              <div className="rounded-[1.35rem] border border-border/70 bg-secondary/45 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("Active recurring rule", "Regla recurrente activa")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(
                        "When active, this charge is posted once per month automatically.",
                        "Cuando está activa, este cargo se registra automáticamente una vez por mes."
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      form.setValue("is_active", checked, {
                        shouldDirty: true,
                        shouldTouch: true,
                      })
                    }
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t(
                    `Debits on day ${chargeDay} every month. For shorter months, it posts on the last calendar day.`,
                    `Debita el día ${chargeDay} de cada mes. En meses más cortos se registra el último día del calendario.`
                  )}
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border/60 bg-background/82 px-5 py-4 backdrop-blur-sm">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("Cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {defaultValues?.amount
                  ? t("Save changes", "Guardar cambios")
                  : t("Add recurring charge", "Agregar cargo recurrente")}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
