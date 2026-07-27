"use client";

import { useEffect, useState } from "react";
import { Landmark, Loader2, PiggyBank, ShieldCheck, Target } from "lucide-react";
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
import {
  WizardModal,
  useDiscardPanel,
  type WizardStep,
} from "@/components/patterns/wizard-modal";
import { FinancialImpact } from "@/components/wealth/financial-impact";
import {
  ReviewRow,
  ReviewTable,
  TypeStep,
  type TypeOption,
} from "@/components/wealth/wizards/wizard-parts";
import { CURRENCIES } from "@/lib/constants";
import { PALETTE } from "@/lib/palette";
import { formatCurrency, parseDecimalInput } from "@/lib/utils";
import { resolveFinancialImpact } from "@/lib/wealth/transaction-effects";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

type Step = "type" | "config" | "review";
type SavingsKind = "emergency" | "goal" | "account" | "other";

const OPTIONS: TypeOption<SavingsKind>[] = [
  {
    value: "emergency",
    icon: ShieldCheck,
    en: "Emergency fund",
    es: "Fondo de emergencia",
    blurbEn: "The money that keeps a bad month from becoming a crisis.",
    blurbEs: "El dinero que evita que un mal mes se vuelva una crisis.",
  },
  {
    value: "goal",
    icon: Target,
    en: "Savings goal",
    es: "Meta de ahorro",
    blurbEn: "A trip, a deposit, a plan with a number attached.",
    blurbEs: "Un viaje, una entrada, un plan con una cifra.",
  },
  {
    value: "account",
    icon: Landmark,
    en: "Savings account",
    es: "Cuenta de ahorro",
    blurbEn: "A bank product you keep set-aside money in.",
    blurbEs: "Un producto del banco donde guardas dinero apartado.",
  },
  {
    value: "other",
    icon: PiggyBank,
    en: "Other savings",
    es: "Otro ahorro",
    blurbEn: "Anything else you have deliberately set aside.",
    blurbEs: "Cualquier otra cosa que hayas apartado a propósito.",
  },
];

export interface SavingsWizardValues {
  kind: SavingsKind;
  name: string;
  bank: string;
  currency: string;
  balance: number;
  target: number | null;
  includeInAvailable: boolean;
}

interface SavingsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SavingsWizardValues) => Promise<unknown>;
}

/**
 * Añadir ahorro — Tipo → Configuración → Revisar.
 *
 * Savings recorded here are money that **already exists** and has been set
 * aside. That is a different thing from a monthly Meta de aportación on
 * Presupuesto, which is how much you intend to save. The same euro must not be
 * counted as both, and step 3 says so.
 */
export function SavingsWizard({
  open,
  onOpenChange,
  onSubmit,
}: SavingsWizardProps) {
  const { t } = useLocale();
  const { baseCurrency, convert } = useCurrency();

  const [step, setStep] = useState<Step>("type");
  const [kind, setKind] = useState<SavingsKind | null>(null);
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [balance, setBalance] = useState("");
  const [target, setTarget] = useState("");
  const [currency, setCurrency] = useState<string>(baseCurrency);
  const [includeInAvailable, setIncludeInAvailable] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("type");
    setKind(null);
    setName("");
    setBank("");
    setBalance("");
    setTarget("");
    setCurrency(baseCurrency);
    setIncludeInAvailable(false);
    setConfirmDiscard(false);
  }, [open, baseCurrency]);

  const parsedBalance = parseDecimalInput(balance);
  const parsedTarget = parseDecimalInput(target);
  const isDirty = kind !== null || name.trim() !== "" || balance.trim() !== "";
  const configValid =
    name.trim().length > 0 && bank.trim().length > 0 && parsedBalance !== null;

  const progress =
    parsedTarget && parsedTarget > 0 && parsedBalance !== null
      ? Math.min(parsedBalance / parsedTarget, 1)
      : null;

  function requestClose() {
    if (submitting) return;
    if (isDirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onOpenChange(false);
  }

  const discard = useDiscardPanel({
    onKeepEditing: () => setConfirmDiscard(false),
    onDiscard: () => onOpenChange(false),
  });

  const impact = resolveFinancialImpact({
    event: "opening_savings",
    amount: convert(parsedBalance ?? 0, currency),
    includeInAvailable,
  });

  async function handleCreate() {
    if (!kind || parsedBalance === null) return;
    setSubmitting(true);
    try {
      await onSubmit({
        kind,
        name: name.trim(),
        bank: bank.trim(),
        currency,
        balance: parsedBalance,
        target: parsedTarget ?? null,
        includeInAvailable,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  const steps: WizardStep<Step>[] = [
    { id: "type", label: t("Type", "Tipo") },
    { id: "config", label: t("Setup", "Configuración") },
    { id: "review", label: t("Review", "Revisar") },
  ];

  const selected = OPTIONS.find((option) => option.value === kind);

  const body = confirmDiscard ? (
    discard.body
  ) : step === "type" ? (
    <TypeStep
      options={OPTIONS}
      value={kind}
      onChange={setKind}
      accent={PALETTE.wealth.savings}
      label={t("Savings type", "Tipo de ahorro")}
    />
  ) : step === "config" ? (
    <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-6">
      <div className="min-w-0 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="savings-wizard-name">{t("Name", "Nombre")}</Label>
            <Input
              id="savings-wizard-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("Emergency fund", "Fondo de emergencia")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="savings-wizard-bank">
              {t("Where it is held", "Dónde está")}
            </Label>
            <Input
              id="savings-wizard-bank"
              value={bank}
              onChange={(event) => setBank(event.target.value)}
              placeholder="Santander"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="savings-wizard-balance">
              {t("Current balance", "Saldo actual")}
            </Label>
            <Input
              id="savings-wizard-balance"
              inputMode="decimal"
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="savings-wizard-target">
              {t("Target (optional)", "Objetivo (opcional)")}
            </Label>
            <Input
              id="savings-wizard-target"
              inputMode="decimal"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="savings-wizard-currency">
              {t("Currency", "Moneda")}
            </Label>
            <Select
              value={currency}
              onValueChange={(value) => value && setCurrency(value)}
            >
              <SelectTrigger id="savings-wizard-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-lg bg-secondary/50 px-3.5 py-3">
          <input
            type="checkbox"
            checked={includeInAvailable}
            onChange={(event) => setIncludeInAvailable(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span className="min-w-0">
            <span className="block text-body font-medium">
              {t("Include in spendable money", "Incluir en dinero disponible")}
            </span>
            <span className="block text-caption text-muted-foreground">
              {includeInAvailable
                ? t(
                    "Counts as money you can spend today.",
                    "Cuenta como dinero que puedes gastar hoy."
                  )
                : t(
                    "Off: reserved for your goal. It still counts toward net worth.",
                    "Desactivado: queda reservado para tu objetivo. Sigue contando en tu patrimonio."
                  )}
            </span>
          </span>
        </label>
      </div>

      <div className="lg:sticky lg:top-0">
        <div className="rounded-2xl bg-secondary/40 p-4 ring-1 ring-border/50">
          <p className="label-caps text-muted-foreground">
            {t("Preview", "Vista previa")}
          </p>
          <div className="mt-3 space-y-1.5">
            <p className="truncate text-body font-medium">
              {name.trim() || t("New fund", "Nuevo fondo")}
            </p>
            <p className="font-mono text-title font-semibold tabular-nums">
              {formatCurrency(parsedBalance ?? 0, currency)}
            </p>
            {parsedTarget && parsedTarget > 0 ? (
              <>
                <p className="text-caption text-muted-foreground">
                  {t("of", "de")} {formatCurrency(parsedTarget, currency)}
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(progress ?? 0) * 100}%`,
                      backgroundColor: PALETTE.wealth.savings,
                    }}
                  />
                </div>
                <p className="text-caption text-muted-foreground">
                  {Math.round((progress ?? 0) * 100)}%{" "}
                  {t("complete", "completado")}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="space-y-4 px-5 py-5 sm:px-6">
      <ReviewTable>
        <ReviewRow
          label={t("Type", "Tipo")}
          value={selected ? t(selected.en, selected.es) : "—"}
        />
        <ReviewRow label={t("Name", "Nombre")} value={name.trim()} />
        <ReviewRow label={t("Held at", "Dónde está")} value={bank.trim()} />
        <ReviewRow
          label={t("Current balance", "Saldo actual")}
          value={formatCurrency(parsedBalance ?? 0, currency)}
        />
        {parsedTarget && parsedTarget > 0 ? (
          <ReviewRow
            label={t("Target", "Objetivo")}
            value={formatCurrency(parsedTarget, currency)}
          />
        ) : null}
        <ReviewRow
          label={t("Normally spendable", "Disponible normalmente")}
          value={includeInAvailable ? t("Yes", "Sí") : t("No", "No")}
        />
      </ReviewTable>

      <FinancialImpact impact={impact} />

      <p className="text-caption text-muted-foreground">
        {t(
          "This records money you have already set aside. It is not a monthly savings goal — that lives on Budget, and counting the same euro in both would double it.",
          "Esto registra dinero que ya has apartado. No es una meta de ahorro mensual — esa vive en Presupuesto, y contar el mismo euro en ambos lo duplicaría."
        )}
      </p>
    </div>
  );

  const footer = confirmDiscard ? (
    discard.footer
  ) : (
    <>
      <Button
        variant="ghost"
        onClick={() =>
          step === "type"
            ? requestClose()
            : setStep(step === "review" ? "config" : "type")
        }
      >
        {step === "type" ? t("Cancel", "Cancelar") : t("Back", "Atrás")}
      </Button>

      {step === "review" ? (
        <Button onClick={handleCreate} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("Create fund", "Crear ahorro")}
        </Button>
      ) : (
        <Button
          onClick={() => setStep(step === "type" ? "config" : "review")}
          disabled={step === "type" ? kind === null : !configValid}
        >
          {t("Continue", "Continuar")}
        </Button>
      )}
    </>
  );

  return (
    <WizardModal
      open={open}
      onOpenChange={requestClose}
      title={t("Add savings", "Añadir ahorro")}
      description={t(
        "Record money you have already set aside.",
        "Registra dinero que ya has separado."
      )}
      steps={steps}
      step={step}
      body={body}
      footer={footer}
      submitting={submitting}
    />
  );
}
