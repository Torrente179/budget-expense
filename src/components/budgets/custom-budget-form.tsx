"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customBudgetSchema,
  type CustomBudgetFormValues,
} from "@/lib/validations";
import { useCurrency } from "@/providers/currency-provider";
import { useCategories } from "@/hooks/use-categories";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatCurrency } from "@/lib/utils";
import { CURRENCIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CategoryBadge, CategoryIcon } from "@/components/shared/category-badge";
import { Check, ChevronDown, Loader2, Plus, Wallet } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

interface CustomBudgetFormProps {
  month: number;
  year: number;
  incomeAmount: number | null;
  incomeCurrency: string;
  onSubmit: (values: CustomBudgetFormValues) => Promise<unknown>;
  defaultValues?: Partial<CustomBudgetFormValues>;
  trigger?: React.ReactNode;
  /** Controlled open state for edit mode */
  controlledOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CustomBudgetForm({
  month,
  year,
  incomeAmount,
  incomeCurrency,
  onSubmit,
  defaultValues,
  trigger,
  controlledOpen,
  onOpenChange,
}: CustomBudgetFormProps) {
  const { t, tc } = useLocale();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => onOpenChange?.(v)
    : setInternalOpen;
  const [submitting, setSubmitting] = useState(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { baseCurrency } = useCurrency();
  const { categories } = useCategories();

  const form = useForm<CustomBudgetFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(customBudgetSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? "",
      amount_type: defaultValues?.amount_type ?? "fixed",
      amount_value:
        defaultValues?.amount_value ?? (undefined as unknown as number),
      currency: defaultValues?.currency ?? baseCurrency,
      category_ids: defaultValues?.category_ids ?? [],
      month,
      year,
    },
  });

  const amountType = form.watch("amount_type");
  const amountValue = Number(form.watch("amount_value")) || 0;
  const selectedCategoryIds: string[] = form.watch("category_ids") ?? [];

  const selectedCategories = categories.filter((c) =>
    selectedCategoryIds.includes(c.id)
  );

  // Edit mode is opened via controlledOpen from a list row — never show a
  // stray "Add budget" trigger that can't open the controlled sheet.
  const showTrigger = Boolean(trigger) || !isControlled;

  function toggleCategory(categoryId: string) {
    const current = form.getValues("category_ids") ?? [];
    const next = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    form.setValue("category_ids", next, { shouldValidate: true });
  }

  async function handleSubmit(values: CustomBudgetFormValues) {
    setSubmitting(true);
    const error = await onSubmit({ ...values, month, year });
    setSubmitting(false);
    if (!error) {
      setOpen(false);
      form.reset({
        name: "",
        amount_type: "fixed",
        amount_value: undefined as unknown as number,
        currency: baseCurrency,
        category_ids: [],
        month,
        year,
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {showTrigger &&
        (trigger ? (
          <SheetTrigger render={trigger as React.ReactElement} />
        ) : (
          <SheetTrigger
            render={
              <Button size="sm" className="w-fit gap-1.5 self-start" />
            }
          >
            <Plus className="h-4 w-4" />
            {t("Add budget", "Agregar presupuesto")}
          </SheetTrigger>
        ))}

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
                <Wallet className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <SheetTitle>
                  {defaultValues?.name
                    ? t("Edit budget", "Editar presupuesto")
                    : t("Create budget", "Crear presupuesto")}
                </SheetTitle>
                <SheetDescription>
                  {t(
                    "Name your budget, set a target amount, and assign the categories it should track.",
                    "Nombra tu presupuesto, define un monto objetivo y asigna las categorías que debe rastrear."
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {/* Budget name */}
            <div className="space-y-2">
              <Label htmlFor="budget-name">
                {t("Budget name", "Nombre del presupuesto")}
              </Label>
              <Input
                id="budget-name"
                type="text"
                placeholder={t(
                  "e.g. Monthly Essentials",
                  "ej. Esenciales del mes"
                )}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Amount type toggle */}
            <div className="space-y-2">
              <Label>{t("Amount type", "Tipo de monto")}</Label>
              <div className="flex rounded-xl border border-border/70 bg-secondary/50 p-1">
                <button
                  type="button"
                  onClick={() => form.setValue("amount_type", "fixed")}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    amountType === "fixed"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("Fixed amount", "Monto fijo")}
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("amount_type", "percentage")}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    amountType === "percentage"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("% of income", "% del ingreso")}
                </button>
              </div>
            </div>

            {/* Amount + Currency */}
            <div
              className={`grid gap-3 ${amountType === "fixed" ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <div className="space-y-2">
                <Label htmlFor="budget-amount">
                  {amountType === "fixed"
                    ? t("Amount", "Monto")
                    : t("Percentage", "Porcentaje")}
                </Label>
                <div className="relative">
                  <Input
                    id="budget-amount"
                    type="number"
                    step={amountType === "fixed" ? "0.01" : "1"}
                    min="0.01"
                    max={amountType === "percentage" ? "100" : undefined}
                    placeholder={amountType === "fixed" ? "0.00" : "30"}
                    className={`font-mono ${amountType === "percentage" ? "pr-8" : ""}`}
                    {...form.register("amount_value")}
                  />
                  {amountType === "percentage" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  )}
                </div>
                {form.formState.errors.amount_value && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.amount_value.message}
                  </p>
                )}
              </div>
              {amountType === "fixed" && (
                <div className="space-y-2">
                  <Label htmlFor="budget-currency">
                    {t("Currency", "Moneda")}
                  </Label>
                  <Select
                    value={form.watch("currency")}
                    onValueChange={(v) => v && form.setValue("currency", v)}
                  >
                    <SelectTrigger
                      id="budget-currency"
                      className="font-mono text-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem
                          key={c.code}
                          value={c.code}
                          className="text-sm"
                        >
                          {c.flag} {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Percentage preview */}
            {amountType === "percentage" && amountValue > 0 && (
              <div className="rounded-xl border border-border/70 bg-card/90 p-4">
                <p className="text-label font-medium uppercase tracking-widest text-muted-foreground">
                  {t("Budget preview", "Vista previa")}
                </p>
                {incomeAmount !== null && incomeAmount > 0 ? (
                  <p className="mt-2 font-heading text-title font-semibold leading-none tracking-tight">
                    {formatCurrency(
                      incomeAmount * (amountValue / 100),
                      incomeCurrency
                    )}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {amountValue}%{" "}
                      {t("of", "de")}{" "}
                      {formatCurrency(incomeAmount, incomeCurrency)}
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-warning">
                    {t(
                      "Set a monthly plan first to see the resolved amount.",
                      "Define un plan mensual primero para ver el monto resultante."
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Category multi-select */}
            <div className="space-y-2">
              <Label>{t("Categories", "Categorías")}</Label>
              <Popover
                open={categoryPopoverOpen}
                onOpenChange={setCategoryPopoverOpen}
              >
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors hover:bg-accent"
                    />
                  }
                >
                  <span
                    className={
                      selectedCategoryIds.length > 0
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {selectedCategoryIds.length > 0
                      ? t(
                          `${selectedCategoryIds.length} categor${selectedCategoryIds.length === 1 ? "y" : "ies"} selected`,
                          `${selectedCategoryIds.length} categoría${selectedCategoryIds.length === 1 ? "" : "s"} seleccionada${selectedCategoryIds.length === 1 ? "" : "s"}`
                        )
                      : t("Select categories", "Seleccionar categorías")}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent className="w-[var(--anchor-width)] p-0">
                  <Command>
                    <CommandInput
                      placeholder={t(
                        "Search categories...",
                        "Buscar categorías..."
                      )}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t("No categories found.", "No se encontraron categorías.")}
                      </CommandEmpty>
                      <CommandGroup>
                        {categories.map((cat) => {
                          const isSelected = selectedCategoryIds.includes(
                            cat.id
                          );
                          return (
                            <CommandItem
                              key={cat.id}
                              value={cat.name}
                              data-checked={isSelected || undefined}
                              onSelect={() => toggleCategory(cat.id)}
                            >
                              <CategoryIcon
                                icon={cat.icon}
                                color={cat.color}
                                className="h-6 w-6 rounded-lg"
                              />
                              <span className="flex-1 text-sm">
                                {tc(cat.name)}
                              </span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-foreground" />
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {form.formState.errors.category_ids && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.category_ids.message}
                </p>
              )}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCategories.map((cat) => (
                    <CategoryBadge
                      key={cat.id}
                      name={tc(cat.name)}
                      icon={cat.icon}
                      color={cat.color}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="border-t border-border/70 bg-background/92 px-5 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              {t("Cancel", "Cancelar")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {defaultValues?.name
                ? t("Save budget", "Guardar presupuesto")
                : t("Create budget", "Crear presupuesto")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
