"use client";

import { useEffect, useState } from "react";
import {
  Car,
  CreditCard,
  Home,
  Landmark,
  Loader2,
  User,
} from "lucide-react";
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
/** Maps to `liabilities.kind`, which only has five values. */
type DebtKind = "credit_card" | "personal" | "mortgage" | "loan" | "other";

const OPTIONS: TypeOption<DebtKind>[] = [
  {
    value: "credit_card",
    icon: CreditCard,
    en: "Credit card",
    es: "Tarjeta de crédito",
    blurbEn: "A revolving balance you carry month to month.",
    blurbEs: "Un saldo que arrastras de mes a mes.",
  },
  {
    value: "personal",
    icon: Landmark,
    en: "Personal loan",
    es: "Préstamo personal",
    blurbEn: "A fixed loan from a bank or lender.",
    blurbEs: "Un préstamo fijo de un banco o entidad.",
  },
  {
    value: "mortgage",
    icon: Home,
    en: "Mortgage",
    es: "Hipoteca",
    blurbEn: "The loan against your home.",
    blurbEs: "El préstamo sobre tu vivienda.",
  },
  {
    value: "loan",
    icon: Car,
    en: "Vehicle finance",
    es: "Financiación de vehículo",
    blurbEn: "Car or motorbike financing.",
    blurbEs: "Financiación de coche o moto.",
  },
  {
    value: "other",
    icon: User,
    en: "Owed to a person",
    es: "Deuda con una persona",
    blurbEn: "Money you owe a friend or family member.",
    blurbEs: "Dinero que debes a un amigo o familiar.",
  },
];

export interface DebtWizardValues {
  name: string;
  kind: DebtKind;
  original_balance: number;
  currency: string;
  interest_rate_percent: number | null;
  notes: string | null;
}

interface DebtWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DebtWizardValues) => Promise<unknown>;
}

/**
 * Añadir deuda — Tipo → Configuración → Revisar.
 *
 * The consequence step matters most here: recording an existing debt raises
 * liabilities and lowers net worth, but it is **not** an expense for this
 * month. Booking a €6.350 opening balance as spending would wreck the month's
 * figures.
 */
export function DebtWizard({ open, onOpenChange, onSubmit }: DebtWizardProps) {
  const { t } = useLocale();
  const { baseCurrency, convert } = useCurrency();

  const [step, setStep] = useState<Step>("type");
  const [kind, setKind] = useState<DebtKind | null>(null);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState<string>(baseCurrency);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("type");
    setKind(null);
    setName("");
    setBalance("");
    setRate("");
    setNotes("");
    setCurrency(baseCurrency);
    setConfirmDiscard(false);
  }, [open, baseCurrency]);

  const parsedBalance = parseDecimalInput(balance);
  const parsedRate = parseDecimalInput(rate);
  const isDirty = kind !== null || name.trim() !== "" || balance.trim() !== "";
  const configValid = name.trim().length > 0 && parsedBalance !== null;

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
    event: "opening_debt",
    amount: convert(parsedBalance ?? 0, currency),
  });

  async function handleCreate() {
    if (!kind || parsedBalance === null) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        kind,
        original_balance: parsedBalance,
        currency,
        interest_rate_percent: parsedRate ?? null,
        notes: notes.trim() || null,
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
      accent={PALETTE.wealth.debts}
      label={t("Debt type", "Tipo de deuda")}
    />
  ) : step === "config" ? (
    <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-6">
      <div className="min-w-0 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="debt-wizard-name">{t("Name", "Nombre")}</Label>
            <Input
              id="debt-wizard-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("Bank loan", "Préstamo Banco")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="debt-wizard-balance">
              {t("Outstanding balance", "Capital pendiente")}
            </Label>
            <Input
              id="debt-wizard-balance"
              inputMode="decimal"
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="debt-wizard-currency">
              {t("Currency", "Moneda")}
            </Label>
            <Select
              value={currency}
              onValueChange={(next) => next && setCurrency(next)}
            >
              <SelectTrigger id="debt-wizard-currency">
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
          <div className="space-y-1.5">
            <Label htmlFor="debt-wizard-rate">
              {t("APR (optional)", "TAE (opcional)")}
            </Label>
            <Input
              id="debt-wizard-rate"
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder="8,90"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="debt-wizard-notes">
              {t("Creditor / note (optional)", "Acreedor / nota (opcional)")}
            </Label>
            <Input
              id="debt-wizard-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <p className="rounded-lg bg-secondary/50 px-3.5 py-3 text-caption text-muted-foreground">
          {t(
            "The opening balance will not be recorded as an expense this month.",
            "El saldo inicial no se registrará como gasto de este mes."
          )}
        </p>
      </div>

      <div className="lg:sticky lg:top-0">
        <div className="rounded-2xl bg-secondary/40 p-4 ring-1 ring-border/50">
          <p className="label-caps text-muted-foreground">
            {t("Preview", "Vista previa")}
          </p>
          <div className="mt-3 space-y-1">
            <p className="truncate text-body font-medium">
              {name.trim() || t("New debt", "Nueva deuda")}
            </p>
            <p className="text-caption text-muted-foreground">
              {selected ? t(selected.en, selected.es) : ""}
            </p>
            <p
              className="pt-1 font-mono text-title font-semibold tabular-nums"
              style={{ color: PALETTE.wealth.debts }}
            >
              {formatCurrency(parsedBalance ?? 0, currency)}
            </p>
            {parsedRate !== null && (
              <p className="text-caption text-muted-foreground">
                {parsedRate}% {t("APR", "TAE")}
              </p>
            )}
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
        <ReviewRow
          label={t("Outstanding", "Capital pendiente")}
          value={formatCurrency(parsedBalance ?? 0, currency)}
        />
        {parsedRate !== null && (
          <ReviewRow
            label={t("APR", "TAE")}
            value={`${parsedRate}%`}
          />
        )}
      </ReviewTable>

      <FinancialImpact impact={impact} flow="expense" />

      <p className="text-caption text-muted-foreground">
        {t(
          "Recording an existing debt lowers your net worth, but the opening balance is not spending — only the payments you make from now on are.",
          "Registrar una deuda existente baja tu patrimonio, pero el saldo inicial no es gasto — solo lo son los pagos que hagas a partir de ahora."
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
          {t("Add debt", "Añadir deuda")}
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
      title={t("Add debt", "Añadir deuda")}
      description={t(
        "Record an outstanding obligation.",
        "Registra una obligación pendiente."
      )}
      steps={steps}
      step={step}
      body={body}
      footer={footer}
      submitting={submitting}
    />
  );
}
