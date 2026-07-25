"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Target,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import {
  customBudgetSchema,
  type CustomBudgetFormValues,
} from "@/lib/validations";
import {
  budgetUsageRatio,
  calculateCustomBudgetSpending,
  resolveCustomBudgetAmount,
} from "@/lib/budgeting";
import {
  contributionGoalBarColor,
  contributionGoalStatusLabel,
  resolveContributionGoalStatus,
  resolveSpendingLimitStatus,
  spendingLimitBarColor,
  spendingLimitStatusLabel,
  type BudgetKind,
} from "@/lib/budgeting/envelope-kinds";
import { cn, formatCurrency } from "@/lib/utils";
import { CURRENCIES } from "@/lib/constants";
import { useCategories } from "@/hooks/use-categories";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WizardModal } from "@/components/patterns/wizard-modal";
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
import {
  CategoryGlyph,
  CategoryIcon,
} from "@/components/shared/category-badge";
import type { Database } from "@/types/database";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

/** Another budget in the same month — used for the overlap warning. */
export interface OverlapBudget {
  id: string;
  name: string;
  categoryIds: string[];
}

type Step = "type" | "config" | "review";

interface BudgetWizardProps {
  month: number;
  year: number;
  incomeAmount: number | null;
  incomeCurrency: string;
  /** This month's expenses — powers the "already spent" reveal. */
  expenses: ExpenseRow[];
  otherBudgets: OverlapBudget[];
  onSubmit: (values: CustomBudgetFormValues) => Promise<unknown>;
  defaultValues?: Partial<CustomBudgetFormValues>;
  /** Edit skips the type step and locks the kind. */
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_WARN_THRESHOLD = 80;

/**
 * Crear presupuesto — centered modal on desktop, bottom sheet on mobile.
 *
 * Three steps, because the two engines genuinely ask different questions:
 * type → configuration (branch-specific) → review. The preview panel renders
 * the real card the user is about to create, already reflecting this month's
 * matching movements, so nothing jumps after saving.
 */
export function BudgetWizard({
  month,
  year,
  incomeAmount,
  incomeCurrency,
  expenses,
  otherBudgets,
  onSubmit,
  defaultValues,
  mode,
  open,
  onOpenChange,
}: BudgetWizardProps) {
  const { t, tc, intlLocale } = useLocale();
  const { baseCurrency, convert } = useCurrency();
  const { categories } = useCategories();

  const isEdit = mode === "edit";
  const [step, setStep] = useState<Step>(isEdit ? "config" : "type");
  const [pickedKind, setPickedKind] = useState<BudgetKind | null>(
    isEdit ? (defaultValues?.kind ?? "spending_limit") : null
  );
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CustomBudgetFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(customBudgetSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? "",
      kind: defaultValues?.kind ?? "spending_limit",
      amount_type: defaultValues?.amount_type ?? "fixed",
      amount_value:
        defaultValues?.amount_value ?? (undefined as unknown as number),
      currency: defaultValues?.currency ?? baseCurrency,
      category_ids: defaultValues?.category_ids ?? [],
      warn_threshold: defaultValues?.warn_threshold ?? null,
      repeats_monthly: defaultValues?.repeats_monthly ?? true,
      month,
      year,
    },
  });

  const kind = form.watch("kind");
  const amountType = form.watch("amount_type");
  const amountValue = Number(form.watch("amount_value")) || 0;
  const currency = form.watch("currency");
  const name = form.watch("name");
  const warnThreshold = form.watch("warn_threshold");
  const repeatsMonthly = form.watch("repeats_monthly");
  const selectedCategoryIds: string[] = form.watch("category_ids") ?? [];
  /* Read during render: react-hook-form's formState proxy only tracks what
     the render subscribes to, so checking isDirty inside a handler alone
     always reports false. */
  const isDirty = form.formState.isDirty;

  const isGoal = kind === "contribution_goal";
  /* Same hexes the goal / limit bars use, so the branch reads consistently. */
  const accent = isGoal ? "#6366F1" : "#3B82F6";

  /* Reset to the first step whenever the modal reopens. */
  useEffect(() => {
    if (!open) return;
    setStep(isEdit ? "config" : "type");
    setPickedKind(isEdit ? (defaultValues?.kind ?? "spending_limit") : null);
    setConfirmDiscard(false);
  }, [open, isEdit, defaultValues?.kind]);

  const selectedCategories = categories.filter((category) =>
    selectedCategoryIds.includes(category.id)
  );
  const leadCategory = selectedCategories[0] ?? null;

  const target = resolveCustomBudgetAmount(
    { amount_type: amountType, amount_value: amountValue, currency },
    incomeAmount,
    convert
  );
  /* Matching this month's movements up front — the card never jumps on save. */
  const matched = calculateCustomBudgetSpending(
    selectedCategoryIds,
    expenses,
    convert
  );
  const ratio = budgetUsageRatio(matched, target);

  /* Cheap enough to run inline — a handful of budgets by a handful of links. */
  const overlaps = (() => {
    if (selectedCategoryIds.length === 0) return [];
    const byCategory = new Map<string, string>();
    for (const budget of otherBudgets) {
      for (const categoryId of budget.categoryIds) {
        if (
          selectedCategoryIds.includes(categoryId) &&
          !byCategory.has(categoryId)
        ) {
          byCategory.set(categoryId, budget.name);
        }
      }
    }
    return [...byCategory.entries()].map(([categoryId, budgetName]) => ({
      categoryName: tc(
        categories.find((category) => category.id === categoryId)?.name ?? ""
      ),
      budgetName,
    }));
  })();

  const configValid =
    name.trim().length > 0 && amountValue > 0 && selectedCategoryIds.length > 0;

  function toggleCategory(categoryId: string) {
    const current = form.getValues("category_ids") ?? [];
    form.setValue(
      "category_ids",
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
      { shouldValidate: true }
    );
  }

  function requestClose() {
    if (submitting) return;
    if (isDirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onOpenChange(false);
  }

  async function handleCreate() {
    setSubmitting(true);
    const error = await onSubmit({ ...form.getValues(), month, year });
    setSubmitting(false);
    if (!error) onOpenChange(false);
  }

  const title = isEdit
    ? isGoal
      ? t("Edit goal", "Editar meta")
      : t("Edit limit", "Editar límite")
    : step === "type"
      ? t("Create budget", "Crear presupuesto")
      : isGoal
        ? t("Create contribution goal", "Crear meta de aportación")
        : t("Create spending limit", "Crear límite de gasto");

  const body = confirmDiscard ? (
    <div className="px-5 py-8 text-center sm:px-8">
      <p className="text-heading font-semibold">
        {t("Discard your changes?", "¿Descartar los cambios?")}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-body text-muted-foreground">
        {t(
          "What you've entered here won't be saved.",
          "Lo que has introducido aquí no se guardará."
        )}
      </p>
    </div>
  ) : (
    <div className="px-5 py-5 sm:px-6">
      {step === "type" && (
        <TypeStep
          picked={pickedKind}
          onPick={(value) => {
            setPickedKind(value);
            form.setValue("kind", value, { shouldDirty: true });
          }}
        />
      )}

      {step === "config" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-6">
          <div className="min-w-0 space-y-4">
            <div
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-border/70"
              style={{ backgroundColor: `${accent}12` }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                {isGoal ? (
                  <Target className="h-4 w-4" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
              </span>
              <p className="text-body font-medium">
                {isGoal
                  ? t("Contribution goal", "Meta de aportación")
                  : t("Spending limit", "Límite de gasto")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-name">{t("Name", "Nombre")}</Label>
              <Input
                id="budget-name"
                type="text"
                autoFocus
                placeholder={
                  isGoal
                    ? t("e.g. Savings", "ej. Ahorro")
                    : t("e.g. Food", "ej. Alimentación")
                }
                {...form.register("name")}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {isGoal
                  ? t("Monthly target", "Objetivo mensual")
                  : t("Monthly limit", "Límite mensual")}
              </Label>
              <div className="flex rounded-xl border border-border/70 bg-secondary/50 p-1">
                <button
                  type="button"
                  onClick={() => form.setValue("amount_type", "fixed")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    amountType === "fixed"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t("Fixed amount", "Importe fijo")}
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("amount_type", "percentage")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    amountType === "percentage"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t("% of income", "% de ingresos")}
                </button>
              </div>
              <div
                className={cn(
                  "grid gap-3",
                  amountType === "fixed" ? "grid-cols-[1fr_7rem]" : "grid-cols-1"
                )}
              >
                <div className="relative">
                  <Input
                    id="budget-amount"
                    type="number"
                    step={amountType === "fixed" ? "0.01" : "1"}
                    min={amountType === "fixed" ? "0.01" : "1"}
                    max={amountType === "percentage" ? "100" : undefined}
                    placeholder={amountType === "fixed" ? "0,00" : "10"}
                    className={cn(
                      "font-mono",
                      amountType === "percentage" && "pr-8"
                    )}
                    {...form.register("amount_value")}
                  />
                  {amountType === "percentage" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  )}
                </div>
                {amountType === "fixed" && (
                  <Select
                    value={currency}
                    onValueChange={(value) =>
                      value && form.setValue("currency", value)
                    }
                  >
                    <SelectTrigger className="font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((item) => (
                        <SelectItem
                          key={item.code}
                          value={item.code}
                          className="text-sm"
                        >
                          {item.flag} {item.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {amountType === "percentage" && (
                <p className="text-caption text-muted-foreground">
                  {incomeAmount != null && incomeAmount > 0 ? (
                    <>
                      {amountValue || 0}% {t("of", "de")}{" "}
                      <span className="font-mono tabular-nums">
                        {formatCurrency(incomeAmount, incomeCurrency, intlLocale)}
                      </span>{" "}
                      ={" "}
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formatCurrency(target, baseCurrency, intlLocale)}
                      </span>
                    </>
                  ) : (
                    t(
                      "Set this month's income first to resolve the amount.",
                      "Define el ingreso del mes para calcular el importe."
                    )
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                {isGoal
                  ? t("Categories that count as contributions", "Categorías que cuentan como aportación")
                  : t("Included categories", "Categorías incluidas")}
              </Label>
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
                          `${selectedCategoryIds.length} selected`,
                          `${selectedCategoryIds.length} seleccionada${selectedCategoryIds.length === 1 ? "" : "s"}`
                        )
                      : t("Add category", "Añadir categoría")}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent className="w-[var(--anchor-width)] p-0">
                  <Command>
                    <CommandInput
                      placeholder={t("Search…", "Buscar…")}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t("Nothing found.", "Sin resultados.")}
                      </CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => {
                          const isSelected = selectedCategoryIds.includes(
                            category.id
                          );
                          return (
                            <CommandItem
                              key={category.id}
                              value={category.name}
                              data-checked={isSelected || undefined}
                              onSelect={() => toggleCategory(category.id)}
                            >
                              <CategoryIcon
                                icon={category.icon}
                                color={category.color}
                                className="h-6 w-6 rounded-lg"
                              />
                              <span className="flex-1 text-sm">
                                {tc(category.name)}
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

              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-caption transition-colors hover:bg-accent"
                    >
                      {tc(category.name)}
                      <span aria-hidden className="text-muted-foreground">
                        ×
                      </span>
                      <span className="sr-only">{t("Remove", "Quitar")}</span>
                    </button>
                  ))}
                </div>
              )}

              {overlaps.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl bg-warning-subtle px-3 py-2.5 ring-1 ring-warning/25">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  <p className="text-caption text-foreground">
                    {overlaps.map((overlap, index) => (
                      <span key={`${overlap.categoryName}-${index}`}>
                        {index > 0 && " "}
                        {t(
                          `${overlap.categoryName} already belongs to "${overlap.budgetName}".`,
                          `${overlap.categoryName} ya pertenece a «${overlap.budgetName}».`
                        )}
                      </span>
                    ))}{" "}
                    <span className="text-muted-foreground">
                      {t(
                        "That spending will count in both, and the plan distribution will count it twice.",
                        "Ese gasto contará en ambos y la distribución del plan lo contará dos veces."
                      )}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {!isGoal && (
              <div className="space-y-2 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="warn-toggle" className="cursor-pointer">
                    {t("Warn me before the limit", "Avisarme antes del límite")}
                  </Label>
                  <Switch
                    id="warn-toggle"
                    checked={warnThreshold != null}
                    onCheckedChange={(checked) =>
                      form.setValue(
                        "warn_threshold",
                        checked ? DEFAULT_WARN_THRESHOLD : null,
                        { shouldDirty: true }
                      )
                    }
                  />
                </div>
                {warnThreshold != null && (
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={50}
                      max={95}
                      step={5}
                      value={warnThreshold}
                      onChange={(event) =>
                        form.setValue(
                          "warn_threshold",
                          Number(event.target.value),
                          { shouldDirty: true }
                        )
                      }
                      className="h-1.5 w-full accent-primary"
                      aria-label={t("Warning threshold", "Umbral de aviso")}
                    />
                    <span className="shrink-0 font-mono text-caption tabular-nums text-muted-foreground">
                      {warnThreshold}% —{" "}
                      {formatCurrency(
                        target * (warnThreshold / 100),
                        baseCurrency,
                        intlLocale
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1 border-t border-border/60 pt-4">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="repeat-toggle" className="cursor-pointer">
                  {t("Repeat every month", "Repetir cada mes")}
                </Label>
                <Switch
                  id="repeat-toggle"
                  checked={repeatsMonthly}
                  onCheckedChange={(checked) =>
                    form.setValue("repeats_monthly", checked, {
                      shouldDirty: true,
                    })
                  }
                />
              </div>
              <p className="text-caption text-muted-foreground">
                {t(
                  "Carried over when you copy the previous month.",
                  "Se incluye al copiar el mes anterior."
                )}
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-0">
            <div className="rounded-2xl bg-secondary/40 p-4 ring-1 ring-border/50">
              <p className="label-caps text-muted-foreground">
                {t("Preview", "Vista previa")}
              </p>
              <div className="mt-3">
                <BudgetPreviewCard
                  kind={kind}
                  name={name}
                  icon={leadCategory?.icon ?? null}
                  color={leadCategory?.color ?? accent}
                  target={target}
                  matched={matched}
                  ratio={ratio}
                />
              </div>
              <p className="mt-3 text-caption text-muted-foreground">
                {selectedCategoryIds.length === 0
                  ? t(
                      "Pick categories to see what already matches this month.",
                      "Elige categorías para ver qué coincide ya este mes."
                    )
                  : matched > 0
                    ? t(
                        `Includes ${formatCurrency(matched, baseCurrency, intlLocale)} already recorded this month.`,
                        `Incluye ${formatCurrency(matched, baseCurrency, intlLocale)} ya registrados este mes.`
                      )
                    : t(
                        "Nothing recorded in these categories yet this month.",
                        "Aún sin movimientos en estas categorías este mes."
                      )}
              </p>
            </div>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="mx-auto max-w-xl space-y-4">
          <BudgetPreviewCard
            kind={kind}
            name={name}
            icon={leadCategory?.icon ?? null}
            color={leadCategory?.color ?? accent}
            target={target}
            matched={matched}
            ratio={ratio}
          />

          <dl className="divide-y divide-border/50 rounded-2xl bg-secondary/40 px-4 ring-1 ring-border/50">
            <ReviewRow
              label={isGoal ? t("Target", "Objetivo") : t("Monthly limit", "Límite mensual")}
              value={
                amountType === "percentage"
                  ? `${amountValue}% ${t("of income", "de los ingresos")} · ${formatCurrency(target, baseCurrency, intlLocale)}`
                  : formatCurrency(target, baseCurrency, intlLocale)
              }
            />
            <ReviewRow
              label={t("Categories", "Categorías")}
              value={selectedCategories
                .map((category) => tc(category.name))
                .join(", ")}
            />
            {!isGoal && (
              <ReviewRow
                label={t("Warning", "Aviso")}
                value={
                  warnThreshold != null
                    ? t(
                        `At ${formatCurrency(target * (warnThreshold / 100), baseCurrency, intlLocale)} (${warnThreshold}%)`,
                        `Al alcanzar ${formatCurrency(target * (warnThreshold / 100), baseCurrency, intlLocale)} (${warnThreshold}%)`
                      )
                    : t("Default (75 / 90 / 100%)", "Por defecto (75 / 90 / 100%)")
                }
              />
            )}
            <ReviewRow
              label={t("Repetition", "Repetición")}
              value={
                repeatsMonthly
                  ? t("Copied to next month", "Se copia al mes siguiente")
                  : t("This month only", "Solo este mes")
              }
            />
          </dl>

          <div className="rounded-2xl bg-info-subtle px-4 py-3 ring-1 ring-info/20">
            <p className="text-body font-medium">
              {t("No money will be moved.", "No se moverá dinero.")}
            </p>
            <p className="mt-1 text-caption text-muted-foreground">
              {isGoal
                ? t(
                    "Movements in these categories count toward the goal automatically.",
                    "Los movimientos de estas categorías cuentan para la meta automáticamente."
                  )
                : t(
                    "Movements in these categories are tracked against the limit automatically.",
                    "Los movimientos de estas categorías se controlan contra el límite automáticamente."
                  )}
            </p>
            {matched > 0 && (
              <p className="mt-2 text-caption font-medium">
                {isGoal
                  ? t(
                      `You've already contributed ${formatCurrency(matched, baseCurrency, intlLocale)} this month (${Math.round(Math.min(ratio, 9.99) * 100)}%).`,
                      `Ya has aportado ${formatCurrency(matched, baseCurrency, intlLocale)} este mes (${Math.round(Math.min(ratio, 9.99) * 100)}%).`
                    )
                  : t(
                      `This limit already has ${formatCurrency(matched, baseCurrency, intlLocale)} spent this month (${Math.round(Math.min(ratio, 9.99) * 100)}%).`,
                      `Este límite ya tiene ${formatCurrency(matched, baseCurrency, intlLocale)} gastados este mes (${Math.round(Math.min(ratio, 9.99) * 100)}%).`
                    )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const footer = confirmDiscard ? (
    <>
      <Button variant="ghost" onClick={() => setConfirmDiscard(false)}>
        {t("Keep editing", "Seguir editando")}
      </Button>
      <Button variant="destructive" onClick={() => onOpenChange(false)}>
        {t("Discard", "Descartar")}
      </Button>
    </>
  ) : (
    <>
      {step === "type" || (isEdit && step === "config") ? (
        <Button variant="ghost" onClick={requestClose}>
          {t("Cancel", "Cancelar")}
        </Button>
      ) : (
        <Button
          variant="ghost"
          className="gap-1.5"
          onClick={() => setStep(step === "review" ? "config" : "type")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Back", "Atrás")}
        </Button>
      )}

      {step === "type" && (
        <Button
          disabled={!pickedKind}
          onClick={() => pickedKind && setStep("config")}
        >
          {t("Continue", "Continuar")}
        </Button>
      )}
      {step === "config" && (
        <Button disabled={!configValid} onClick={() => setStep("review")}>
          {isGoal
            ? t("Review goal", "Revisar meta")
            : t("Review limit", "Revisar límite")}
        </Button>
      )}
      {step === "review" && (
        <Button disabled={submitting} onClick={handleCreate}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit
            ? t("Save changes", "Guardar cambios")
            : isGoal
              ? t("Create goal", "Crear meta")
              : t("Create limit", "Crear límite")}
        </Button>
      )}
    </>
  );

  return (
    <WizardModal
      open={open}
      onOpenChange={requestClose}
      title={title}
      description={t(
        "Set up a rule to organize your money each month.",
        "Configura una regla para organizar tu dinero cada mes."
      )}
      steps={
        isEdit
          ? [
              { id: "config" as Step, label: t("Setup", "Configuración") },
              { id: "review" as Step, label: t("Review", "Revisar") },
            ]
          : [
              { id: "type" as Step, label: t("Type", "Tipo") },
              { id: "config" as Step, label: t("Setup", "Configuración") },
              { id: "review" as Step, label: t("Review", "Revisar") },
            ]
      }
      step={step}
      body={body}
      footer={footer}
      submitting={submitting}
    />
  );
}

function TypeStep({
  picked,
  onPick,
}: {
  picked: BudgetKind | null;
  onPick: (kind: BudgetKind) => void;
}) {
  const { t } = useLocale();

  const options = [
    {
      kind: "spending_limit" as const,
      icon: Wallet,
      accent: "#3B82F6",
      title: t("Spending limit", "Límite de gasto"),
      body: t(
        "Control how much you can spend across one or more categories.",
        "Controla cuánto puedes gastar en una o varias categorías."
      ),
      examples: t(
        "Food · Housing · Transport",
        "Alimentación · Vivienda · Transporte"
      ),
      tag: t("To control spending", "Para controlar gastos"),
    },
    {
      kind: "contribution_goal" as const,
      icon: Target,
      accent: "#6366F1",
      title: t("Contribution goal", "Meta de aportación"),
      body: t(
        "Set how much you want to contribute to savings, investing or giving.",
        "Define cuánto quieres aportar a ahorro, inversión o generosidad."
      ),
      examples: t("Savings · Investing · Tithe", "Ahorro · Inversión · Diezmo"),
      tag: t("To build toward goals", "Para construir objetivos"),
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-heading font-semibold">
        {t("What do you want to create?", "¿Qué quieres crear?")}
      </p>
      <div
        role="radiogroup"
        className="grid gap-3 sm:grid-cols-2"
        aria-label={t("Budget type", "Tipo de presupuesto")}
      >
        {options.map((option) => {
          const Icon = option.icon;
          const selected = picked === option.kind;
          return (
            <button
              key={option.kind}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onPick(option.kind)}
              className={cn(
                "group relative flex flex-col items-center gap-3 rounded-2xl px-5 py-6 text-center transition-all",
                selected
                  ? "bg-card shadow-2"
                  : "bg-card/60 ring-1 ring-border/70 hover:bg-card hover:shadow-1"
              )}
              style={
                selected
                  ? { boxShadow: `inset 0 0 0 2px ${option.accent}` }
                  : undefined
              }
            >
              <span
                aria-hidden
                className="absolute right-4 top-4 h-4 w-4 rounded-full transition-colors"
                style={
                  selected
                    ? {
                        backgroundColor: option.accent,
                        boxShadow: "inset 0 0 0 2px var(--card)",
                      }
                    : { boxShadow: "inset 0 0 0 1.5px var(--border)" }
                }
              />
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${option.accent}1a`,
                  color: option.accent,
                }}
              >
                <Icon className="h-7 w-7" strokeWidth={1.6} />
              </span>
              <span className="text-body font-semibold">{option.title}</span>
              <span className="max-w-[16rem] text-caption text-muted-foreground">
                {option.body}
              </span>
              <span className="text-caption text-muted-foreground/80">
                {option.examples}
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-caption font-medium"
                style={{
                  backgroundColor: `${option.accent}14`,
                  color: option.accent,
                }}
              >
                {option.tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The real card the user is about to create, matched against this month. */
function BudgetPreviewCard({
  kind,
  name,
  icon,
  color,
  target,
  matched,
  ratio,
}: {
  kind: BudgetKind;
  name: string;
  icon: string | null;
  color: string;
  target: number;
  matched: number;
  ratio: number;
}) {
  const { t, locale, intlLocale } = useLocale();
  const { baseCurrency } = useCurrency();
  const isGoal = kind === "contribution_goal";

  const barColor = isGoal
    ? contributionGoalBarColor(resolveContributionGoalStatus(matched, target))
    : spendingLimitBarColor(resolveSpendingLimitStatus(ratio));
  const statusLabel = isGoal
    ? contributionGoalStatusLabel(
        resolveContributionGoalStatus(matched, target),
        ratio,
        locale
      )
    : spendingLimitStatusLabel(resolveSpendingLimitStatus(ratio), locale);
  const pct = Number.isFinite(ratio)
    ? Math.round(Math.min(ratio, 9.99) * 100)
    : 0;
  const fill = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : 1;

  return (
    <div className="rounded-2xl bg-card px-3.5 py-3 shadow-1 ring-1 ring-border/60">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}1f`, color }}
          aria-hidden
        >
          {icon ? (
            <CategoryGlyph icon={icon} className="h-[1.125rem] w-[1.125rem]" />
          ) : isGoal ? (
            <Target className="h-[1.125rem] w-[1.125rem]" />
          ) : (
            <Wallet className="h-[1.125rem] w-[1.125rem]" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium">
            {name.trim() ||
              (isGoal ? t("New goal", "Nueva meta") : t("New limit", "Nuevo límite"))}
          </p>
          <p className="mt-0.5 font-mono text-caption tabular-nums text-muted-foreground">
            {pct}%{" "}
            {isGoal ? t("complete", "completado") : t("used", "usado")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-body font-semibold tabular-nums">
            {formatCurrency(
              isGoal ? target : Math.max(target - matched, 0),
              baseCurrency,
              intlLocale
            )}
          </p>
          <p className="text-[0.6875rem] text-muted-foreground">
            {isGoal ? t("target", "objetivo") : t("available", "disponibles")}
          </p>
        </div>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${fill * 100}%`, backgroundColor: barColor }}
        />
      </div>
      <p
        className="mt-2 text-caption font-medium"
        style={{ color: barColor }}
      >
        {statusLabel}
      </p>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-caption font-medium">{value}</dd>
    </div>
  );
}
