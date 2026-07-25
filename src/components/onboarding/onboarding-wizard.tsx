"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/providers/locale-provider";
import { useCurrency } from "@/providers/currency-provider";
import { useCategories } from "@/hooks/use-categories";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useRecurringExpenses } from "@/hooks/use-recurring-expenses";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { applyOnboardingPersonalization } from "@/lib/onboarding/apply";
import { buildPersonalization } from "@/lib/onboarding/personalize";
import {
  PRIMARY_GOALS,
  goalLabel,
  type PrimaryGoal,
} from "@/lib/onboarding/goals";
import {
  getBudgetingMethodById,
  getBudgetingMethods,
} from "@/lib/budgeting-methods";
import { CURRENCIES } from "@/lib/constants";
import { liabilityKindOptions } from "@/lib/liability-kinds";
import { resolveRecurringStartDate } from "@/lib/recurring-expenses";
import { normalizeDecimalInput, parseDecimalInput, cn } from "@/lib/utils";
import {
  CategoryOption,
  CATEGORY_SELECT_CONTENT_CLASS,
} from "@/components/shared/category-badge";
import { Screen } from "@/components/patterns/screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type Step =
  | "welcome"
  | "income"
  | "recurring"
  | "debt"
  | "goals"
  | "suggestions";

interface DraftRecurring {
  key: string;
  description: string;
  amount: string;
  categoryId: string;
  chargeDay: string;
}

interface DraftDebt {
  key: string;
  name: string;
  kind: "loan" | "mortgage" | "credit_card" | "personal" | "other";
  balance: string;
}

const STEPS: Step[] = [
  "welcome",
  "income",
  "recurring",
  "debt",
  "goals",
  "suggestions",
];

function isBlankRecurringRow(row: DraftRecurring) {
  return (
    !row.description.trim() &&
    !row.amount.trim() &&
    !row.categoryId &&
    !row.chargeDay.trim()
  );
}

function isIncompleteRecurringRow(row: DraftRecurring) {
  if (isBlankRecurringRow(row)) return false;
  const amount = parseDecimalInput(row.amount);
  const chargeDay = Number(row.chargeDay);
  return (
    !row.description.trim() ||
    typeof amount !== "number" ||
    amount <= 0 ||
    !row.categoryId ||
    !Number.isFinite(chargeDay) ||
    chargeDay < 1 ||
    chargeDay > 31
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const { t, tc, locale } = useLocale();
  const { baseCurrency } = useCurrency();
  const { categories } = useCategories();
  const { skipOnboarding, completeOnboarding } = useOnboarding();
  const { addRecurringExpense } = useRecurringExpenses();

  const [step, setStep] = useState<Step>("welcome");
  const [saving, setSaving] = useState(false);

  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeCurrency, setIncomeCurrency] = useState(baseCurrency);
  const [recurringRows, setRecurringRows] = useState<DraftRecurring[]>([]);
  const [debtRows, setDebtRows] = useState<DraftDebt[]>([]);
  const [wantsBudgetHelp, setWantsBudgetHelp] = useState<boolean | null>(null);
  const [goals, setGoals] = useState<PrimaryGoal[]>([]);
  /** User-chosen budget profile; null until seeded from the suggestion. */
  const [methodId, setMethodId] = useState<string | null>(null);
  const [methodTouched, setMethodTouched] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const currencyItems = useMemo(
    () => CURRENCIES.map((item) => ({ value: item.code, label: item.code })),
    []
  );
  const categoryItems = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: tc(category.name),
      })),
    [categories, tc]
  );
  const debtKindItems = useMemo(() => liabilityKindOptions(t), [t]);
  const budgetingMethods = useMemo(
    () => getBudgetingMethods(locale).methods,
    [locale]
  );

  const suggestedPersonalization = useMemo(
    () =>
      buildPersonalization({
        wantsBudgetHelp: wantsBudgetHelp === true,
        goals,
        hasDebts: debtRows.some((row) => parseDecimalInput(row.balance)),
      }),
    [wantsBudgetHelp, goals, debtRows]
  );

  // Keep the picker on the suggested method until the user picks another.
  useEffect(() => {
    if (methodTouched) return;
    setMethodId(suggestedPersonalization.methodId);
  }, [suggestedPersonalization.methodId, methodTouched]);

  const personalization = useMemo(
    () =>
      buildPersonalization({
        wantsBudgetHelp: wantsBudgetHelp === true,
        goals,
        hasDebts: debtRows.some((row) => parseDecimalInput(row.balance)),
        methodId,
      }),
    [wantsBudgetHelp, goals, debtRows, methodId]
  );

  const selectedMethod = personalization.methodId
    ? getBudgetingMethodById(locale, personalization.methodId)
    : null;
  const suggestedMethodId = suggestedPersonalization.methodId;

  function goNext() {
    if (step === "recurring" && recurringRows.some(isIncompleteRecurringRow)) {
      toast.error(
        t(
          "For each fixed expense, fill description, amount, category, and monthly charge day.",
          "En cada gasto fijo, completa descripción, importe, categoría y día de cargo mensual."
        )
      );
      return;
    }
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  async function handleSkip() {
    setSaving(true);
    try {
      await skipOnboarding();
      router.replace("/home");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        t("Could not skip setup", "No se pudo saltar la configuración")
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    const amount = parseDecimalInput(incomeAmount);
    if (typeof amount !== "number" || amount <= 0) {
      toast.error(t("Enter a valid monthly income", "Introduce un ingreso mensual válido"));
      setStep("income");
      return;
    }
    if (wantsBudgetHelp === null) {
      toast.error(
        t("Tell us if you want budgeting help", "Indica si quieres ayuda con el presupuesto")
      );
      setStep("goals");
      return;
    }

    if (recurringRows.some(isIncompleteRecurringRow)) {
      toast.error(
        t(
          "For each fixed expense, fill description, amount, category, and monthly charge day.",
          "En cada gasto fijo, completa descripción, importe, categoría y día de cargo mensual."
        )
      );
      setStep("recurring");
      return;
    }

    setSaving(true);
    try {
      for (const row of recurringRows) {
        if (isBlankRecurringRow(row)) continue;
        const rowAmount = parseDecimalInput(row.amount);
        if (
          typeof rowAmount !== "number" ||
          rowAmount <= 0 ||
          !row.description.trim() ||
          !row.categoryId
        ) {
          continue;
        }
        const chargeDay = Math.min(31, Math.max(1, Number(row.chargeDay)));
        await addRecurringExpense({
          amount: rowAmount,
          currency: incomeCurrency,
          category_id: row.categoryId,
          charge_day: chargeDay,
          start_date: resolveRecurringStartDate(chargeDay),
          description: row.description.trim(),
          is_active: true,
        });
      }

      for (const row of debtRows) {
        const balance = parseDecimalInput(row.balance);
        if (typeof balance !== "number" || balance <= 0 || !row.name.trim()) {
          continue;
        }
        await authorizedFetch("/api/liabilities", {
          method: "POST",
          body: JSON.stringify({
            name: row.name.trim(),
            kind: row.kind,
            original_balance: balance,
            currency: incomeCurrency,
          }),
        }).catch(() => null);
      }

      await applyOnboardingPersonalization({
        locale,
        incomeAmount: amount,
        incomeCurrency,
        wantsBudgetHelp,
        goals,
        hasDebts: debtRows.length > 0,
        methodId: wantsBudgetHelp ? methodId : null,
      });

      await completeOnboarding({ wantsBudgetHelp, goals });
      toast.success(t("You're set up", "Todo listo"));
      router.replace("/home");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        t("Could not finish setup", "No se pudo completar la configuración")
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleGoal(goal: PrimaryGoal) {
    setGoals((previous) =>
      previous.includes(goal)
        ? previous.filter((item) => item !== goal)
        : [...previous, goal]
    );
  }

  return (
    <Screen title={t("Setup", "Configuración")}>
      <div className="mx-auto w-full max-w-lg space-y-5">
        <div className="flex gap-1.5">
          {STEPS.map((item, index) => (
            <div
              key={item}
              className={cn(
                "h-1 flex-1 rounded-full",
                index <= stepIndex ? "bg-foreground" : "bg-secondary"
              )}
            />
          ))}
        </div>

        {step === "welcome" && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h2 className="text-heading font-semibold">
                {t("A few things about your money", "Unas cuantas cosas sobre tu dinero")}
              </h2>
              <p className="text-body text-muted-foreground">
                {t(
                  "Income, fixed bills, debts, and goals. We'll tune Budget and Home from that. Skip whenever you want.",
                  "Ingresos, gastos fijos, deudas y metas. Con eso ajustamos Presupuesto e Inicio. Puedes saltarlo cuando quieras."
                )}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={goNext}>
                  {t("Start", "Empezar")}
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  disabled={saving}
                  onClick={handleSkip}
                >
                  {t("Skip for now", "Saltar por ahora")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "income" && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h2 className="text-heading font-semibold">
                {t("Monthly income", "Ingreso mensual")}
              </h2>
              <p className="text-caption text-muted-foreground">
                {t(
                  "What you usually take home this month.",
                  "Lo que sueles cobrar neto este mes."
                )}
              </p>
              <div className="flex gap-2">
                <Input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={incomeAmount}
                  onChange={(e) =>
                    setIncomeAmount(normalizeDecimalInput(e.target.value))
                  }
                  className="h-12 flex-1 font-mono text-xl"
                />
                <Select
                  value={incomeCurrency}
                  onValueChange={(value) =>
                    setIncomeCurrency(value ?? baseCurrency)
                  }
                  items={currencyItems}
                >
                  <SelectTrigger className="h-12 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <StepNav
                onBack={goBack}
                onNext={goNext}
                onSkip={handleSkip}
                skipping={saving}
              />
            </CardContent>
          </Card>
        )}

        {step === "recurring" && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h2 className="text-heading font-semibold">
                {t("Recurring / fixed expenses", "Gastos fijos / recurrentes")}
              </h2>
              <p className="text-caption text-muted-foreground">
                {t(
                  "Rent, utilities, subscriptions — each one repeats every month on the charge day you choose. Optional.",
                  "Alquiler, servicios, suscripciones — cada uno se repite cada mes el día de cargo que elijas. Opcional."
                )}
              </p>
              <div className="space-y-3">
                {recurringRows.map((row) => {
                  const selectedCategory = categories.find(
                    (category) => category.id === row.categoryId
                  );
                  return (
                    <div
                      key={row.key}
                      className="space-y-2 rounded-xl border border-border p-3"
                    >
                      <Input
                        placeholder={t("Description", "Descripción")}
                        value={row.description}
                        onChange={(e) =>
                          setRecurringRows((rows) =>
                            rows.map((item) =>
                              item.key === row.key
                                ? { ...item, description: e.target.value }
                                : item
                            )
                          )
                        }
                      />
                      <div className="flex gap-2">
                        <Input
                          inputMode="decimal"
                          placeholder={t("Amount", "Importe")}
                          value={row.amount}
                          className="font-mono text-foreground tabular-nums"
                          onChange={(e) =>
                            setRecurringRows((rows) =>
                              rows.map((item) =>
                                item.key === row.key
                                  ? {
                                      ...item,
                                      amount: normalizeDecimalInput(
                                        e.target.value
                                      ),
                                    }
                                  : item
                              )
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setRecurringRows((rows) =>
                              rows.filter((item) => item.key !== row.key)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            {t("Category", "Categoría")}
                          </Label>
                          <Select
                            value={row.categoryId || undefined}
                            onValueChange={(value) =>
                              setRecurringRows((rows) =>
                                rows.map((item) =>
                                  item.key === row.key
                                    ? { ...item, categoryId: value ?? "" }
                                    : item
                                )
                              )
                            }
                            items={categoryItems}
                          >
                            <SelectTrigger className="h-11 w-full min-w-0 border-border/80 bg-secondary/40">
                              <SelectValue
                                placeholder={t("Select", "Selecciona")}
                              >
                                {selectedCategory ? (
                                  <CategoryOption
                                    name={tc(selectedCategory.name)}
                                    icon={selectedCategory.icon}
                                    color={selectedCategory.color}
                                  />
                                ) : undefined}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent
                              className={CATEGORY_SELECT_CONTENT_CLASS}
                            >
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                  className="text-sm"
                                >
                                  <CategoryOption
                                    name={tc(category.name)}
                                    icon={category.icon}
                                    color={category.color}
                                  />
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            {t("Monthly charge day", "Día de cargo mensual")}
                          </Label>
                          <Input
                            inputMode="numeric"
                            type="number"
                            min={1}
                            max={31}
                            placeholder={t("1–31", "1–31")}
                            value={row.chargeDay}
                            onChange={(e) =>
                              setRecurringRows((rows) =>
                                rows.map((item) =>
                                  item.key === row.key
                                    ? { ...item, chargeDay: e.target.value }
                                    : item
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "Repeats every month. If that day already passed, it starts next month.",
                          "Se repite cada mes. Si ese día ya pasó, empieza el mes siguiente."
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() =>
                  setRecurringRows((rows) => [
                    ...rows,
                    {
                      key: crypto.randomUUID(),
                      description: "",
                      amount: "",
                      categoryId: "",
                      chargeDay: "",
                    },
                  ])
                }
              >
                <Plus className="h-4 w-4" />
                {t("Add fixed expense", "Añadir gasto fijo")}
              </Button>
              <StepNav
                onBack={goBack}
                onNext={goNext}
                onSkip={handleSkip}
                skipping={saving}
                nextLabel={t("Continue", "Continuar")}
              />
            </CardContent>
          </Card>
        )}

        {step === "debt" && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h2 className="text-heading font-semibold">
                {t("Debt", "Deudas")}
              </h2>
              <p className="text-caption text-muted-foreground">
                {t(
                  "Loans, cards, mortgages — optional but helps personalize Wealth.",
                  "Préstamos, tarjetas, hipoteca — opcional, pero personaliza Patrimonio."
                )}
              </p>
              <div className="space-y-3">
                {debtRows.map((row) => (
                  <div
                    key={row.key}
                    className="space-y-2 rounded-xl border border-border p-3"
                  >
                    <Input
                      placeholder={t("Name", "Nombre")}
                      value={row.name}
                      onChange={(e) =>
                        setDebtRows((rows) =>
                          rows.map((item) =>
                            item.key === row.key
                              ? { ...item, name: e.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <Select
                        value={row.kind}
                        onValueChange={(value) =>
                          setDebtRows((rows) =>
                            rows.map((item) =>
                              item.key === row.key
                                ? {
                                    ...item,
                                    kind: (value ?? "loan") as DraftDebt["kind"],
                                  }
                                : item
                            )
                          )
                        }
                        items={debtKindItems}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {debtKindItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        inputMode="decimal"
                        placeholder={t("Balance", "Saldo")}
                        value={row.balance}
                        onChange={(e) =>
                          setDebtRows((rows) =>
                            rows.map((item) =>
                              item.key === row.key
                                ? {
                                    ...item,
                                    balance: normalizeDecimalInput(e.target.value),
                                  }
                                : item
                            )
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDebtRows((rows) =>
                            rows.filter((item) => item.key !== row.key)
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() =>
                  setDebtRows((rows) => [
                    ...rows,
                    {
                      key: crypto.randomUUID(),
                      name: "",
                      kind: "loan",
                      balance: "",
                    },
                  ])
                }
              >
                <Plus className="h-4 w-4" />
                {t("Add debt", "Añadir deuda")}
              </Button>
              <StepNav
                onBack={goBack}
                onNext={goNext}
                onSkip={handleSkip}
                skipping={saving}
              />
            </CardContent>
          </Card>
        )}

        {step === "goals" && (
          <Card>
            <CardContent className="space-y-5 py-6">
              <div className="space-y-3">
                <h2 className="text-heading font-semibold">
                  {t("Want a hand with the budget?", "¿Te echo una mano con el presupuesto?")}
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: true, label: t("Yes", "Sí") },
                    { value: false, label: t("No", "No") },
                  ].map((option) => (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => setWantsBudgetHelp(option.value)}
                      className={cn(
                        "min-h-12 rounded-xl border px-3 text-body font-medium transition-colors",
                        wantsBudgetHelp === option.value
                          ? "border-foreground bg-secondary"
                          : "border-border hover:bg-accent"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>{t("Financial goals", "Metas financieras")}</Label>
                <div className="grid gap-2">
                  {PRIMARY_GOALS.map((goal) => {
                    const selected = goals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={cn(
                          "min-h-12 rounded-xl border px-3 text-left text-body font-medium transition-colors",
                          selected
                            ? "border-foreground bg-secondary"
                            : "border-border hover:bg-accent"
                        )}
                      >
                        {goalLabel(goal, locale)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <StepNav
                onBack={goBack}
                onNext={goNext}
                onSkip={handleSkip}
                skipping={saving}
              />
            </CardContent>
          </Card>
        )}

        {step === "suggestions" && (
          <Card>
            <CardContent className="space-y-4 py-6">
              <h2 className="text-heading font-semibold">
                {t("What we'll set up", "Lo que vamos a dejar listo")}
              </h2>
              <ul className="space-y-2 text-body text-muted-foreground">
                <li>
                  {t(
                    "This month's income, saved on your plan.",
                    "El ingreso de este mes, guardado en tu plan."
                  )}
                </li>
                {wantsBudgetHelp && personalization.seedEnvelopes.length > 0 && (
                  <li>
                    {t(
                      `We'll add ${personalization.seedEnvelopes.length} starter budgets.`,
                      `Añadiremos ${personalization.seedEnvelopes.length} presupuestos de partida.`
                    )}
                  </li>
                )}
                {personalization.attentionHints.includes("pay_debt") && (
                  <li>
                    {t(
                      "We'll surface your debts under Wealth.",
                      "Destacaremos tus deudas en Patrimonio."
                    )}
                  </li>
                )}
              </ul>

              {wantsBudgetHelp && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>
                      {t("Budget profile", "Perfil de presupuesto")}
                    </Label>
                    <p className="text-caption text-muted-foreground">
                      {t(
                        "We suggested one from your goals — tap another if you prefer.",
                        "Sugerimos uno según tus metas — toca otro si prefieres."
                      )}
                    </p>
                  </div>
                  <div
                    role="radiogroup"
                    aria-label={t("Budget profile", "Perfil de presupuesto")}
                    className="grid gap-2"
                  >
                    {budgetingMethods.map((method) => {
                      const selected = methodId === method.id;
                      const isSuggestion = method.id === suggestedMethodId;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => {
                            setMethodTouched(true);
                            setMethodId(method.id);
                          }}
                          className={cn(
                            "min-h-14 rounded-xl border px-3 py-3 text-left transition-colors",
                            selected
                              ? "border-foreground bg-secondary"
                              : "border-border hover:bg-accent"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                                selected
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border"
                              )}
                            >
                              {selected && <Check className="h-3 w-3" />}
                            </span>
                            <span className="min-w-0 flex-1 space-y-0.5">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-body font-medium text-foreground">
                                  {method.name}
                                </span>
                                {isSuggestion && (
                                  <span className="text-caption text-muted-foreground">
                                    {t("Suggested", "Sugerido")}
                                  </span>
                                )}
                              </span>
                              <span className="block text-caption text-muted-foreground">
                                {method.tagline}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedMethod && (
                    <p className="text-caption text-muted-foreground">
                      {selectedMethod.description}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="ghost" onClick={goBack} disabled={saving}>
                    {t("Back", "Atrás")}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleFinish}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("Finish setup", "Terminar configuración")}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  disabled={saving}
                  onClick={handleSkip}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("Skip for now", "Saltar por ahora")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Screen>
  );
}

function StepNav({
  onBack,
  onNext,
  onSkip,
  skipping,
  nextLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  skipping?: boolean;
  nextLabel?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-2 pt-2">
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={skipping}>
          {t("Back", "Atrás")}
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={onNext}
          disabled={skipping}
        >
          {nextLabel ?? t("Continue", "Continuar")}
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="w-full text-muted-foreground"
        disabled={skipping}
        onClick={onSkip}
      >
        {skipping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("Skip for now", "Saltar por ahora")}
      </Button>
    </div>
  );
}
