"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { getBudgetingMethodById } from "@/lib/budgeting-methods";
import { CURRENCIES } from "@/lib/constants";
import {
  getCurrentMonth,
  getCurrentYear,
  normalizeDecimalInput,
  parseDecimalInput,
  cn,
} from "@/lib/utils";
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

export function OnboardingWizard() {
  const router = useRouter();
  const { t, locale } = useLocale();
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

  const stepIndex = STEPS.indexOf(step);
  const currencyItems = useMemo(
    () => CURRENCIES.map((item) => ({ value: item.code, label: item.code })),
    []
  );

  const personalization = useMemo(
    () =>
      buildPersonalization({
        wantsBudgetHelp: wantsBudgetHelp === true,
        goals,
        hasDebts: debtRows.some((row) => parseDecimalInput(row.balance)),
      }),
    [wantsBudgetHelp, goals, debtRows]
  );

  const suggestedMethod = personalization.methodId
    ? getBudgetingMethodById(locale, personalization.methodId)
    : null;

  function goNext() {
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

    setSaving(true);
    try {
      const housingCategory =
        categories.find((c) => c.name.toLowerCase().includes("housing")) ??
        categories.find((c) => c.classification === "essential") ??
        categories[0];

      for (const row of recurringRows) {
        const rowAmount = parseDecimalInput(row.amount);
        if (typeof rowAmount !== "number" || rowAmount <= 0 || !row.description.trim()) {
          continue;
        }
        await addRecurringExpense({
          amount: rowAmount,
          currency: incomeCurrency,
          category_id: row.categoryId || housingCategory?.id || "",
          charge_day: Math.min(31, Math.max(1, Number(row.chargeDay) || 1)),
          start_date: `${getCurrentYear()}-${String(getCurrentMonth()).padStart(2, "0")}-01`,
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
                {t("Let's set up your money map", "Configuremos tu mapa financiero")}
              </h2>
              <p className="text-body text-muted-foreground">
                {t(
                  "We'll ask about income, fixed bills, debts, and goals — then tune Budget and Home for you. You can skip anytime.",
                  "Te preguntaremos por ingresos, gastos fijos, deudas y metas — y ajustaremos Presupuesto e Inicio. Puedes saltarlo cuando quieras."
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
                  "Typical take-home pay for this month.",
                  "Tu ingreso neto habitual de este mes."
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
                  "Rent, utilities, subscriptions — add what you know. Optional.",
                  "Alquiler, servicios, suscripciones — añade lo que sepas. Opcional."
                )}
              </p>
              <div className="space-y-3">
                {recurringRows.map((row) => (
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
                        onChange={(e) =>
                          setRecurringRows((rows) =>
                            rows.map((item) =>
                              item.key === row.key
                                ? {
                                    ...item,
                                    amount: normalizeDecimalInput(e.target.value),
                                  }
                                : item
                            )
                          )
                        }
                      />
                      <Input
                        inputMode="numeric"
                        placeholder={t("Day", "Día")}
                        className="w-20"
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
                  </div>
                ))}
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
                      categoryId: categories[0]?.id ?? "",
                      chargeDay: "1",
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
                        items={[
                          { value: "loan", label: t("Loan", "Préstamo") },
                          { value: "mortgage", label: t("Mortgage", "Hipoteca") },
                          {
                            value: "credit_card",
                            label: t("Credit card", "Tarjeta"),
                          },
                          {
                            value: "personal",
                            label: t("Personal", "Personal"),
                          },
                          { value: "other", label: t("Other", "Otro") },
                        ]}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="loan">{t("Loan", "Préstamo")}</SelectItem>
                          <SelectItem value="mortgage">
                            {t("Mortgage", "Hipoteca")}
                          </SelectItem>
                          <SelectItem value="credit_card">
                            {t("Credit card", "Tarjeta")}
                          </SelectItem>
                          <SelectItem value="personal">
                            {t("Personal", "Personal")}
                          </SelectItem>
                          <SelectItem value="other">{t("Other", "Otro")}</SelectItem>
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
                  {t("Do you want help with budgeting?", "¿Quieres ayuda con el presupuesto?")}
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
                {t("Your setup plan", "Tu plan de configuración")}
              </h2>
              <ul className="space-y-2 text-body text-muted-foreground">
                <li>
                  {t("Monthly plan income will be saved for this month.", "Se guardará el ingreso del plan de este mes.")}
                </li>
                {suggestedMethod && (
                  <li>
                    {t("Suggested method", "Método sugerido")}:{" "}
                    <span className="font-medium text-foreground">
                      {suggestedMethod.name}
                    </span>{" "}
                    — {suggestedMethod.tagline}
                  </li>
                )}
                {wantsBudgetHelp && personalization.seedEnvelopes.length > 0 && (
                  <li>
                    {t(
                      `We'll create ${personalization.seedEnvelopes.length} starter budget envelopes.`,
                      `Crearemos ${personalization.seedEnvelopes.length} presupuestos iniciales.`
                    )}
                  </li>
                )}
                {personalization.attentionHints.includes("pay_debt") && (
                  <li>
                    {t(
                      "Wealth → Liabilities will be highlighted for debt payoff.",
                      "Patrimonio → Pasivos se destacará para pagar deudas."
                    )}
                  </li>
                )}
              </ul>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="ghost" onClick={goBack} disabled={saving}>
                    {t("Back", "Atrás")}
                  </Button>
                  <Button className="flex-1" onClick={handleFinish} disabled={saving}>
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
