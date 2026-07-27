"use client";

import { useEffect, useState } from "react";
import { HandCoins, History, Loader2 } from "lucide-react";
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
/** The branch that decides the financial effect — see the doc comment below. */
type LoanTiming = "existing" | "now";

const OPTIONS: TypeOption<LoanTiming>[] = [
  {
    value: "existing",
    icon: History,
    en: "Already lent",
    es: "Ya fue prestado",
    blurbEn: "The money left your account some time ago.",
    blurbEs: "El dinero salió de tu cuenta hace tiempo.",
  },
  {
    value: "now",
    icon: HandCoins,
    en: "Lending it now",
    es: "Voy a prestarlo ahora",
    blurbEn: "The money is leaving your account today.",
    blurbEs: "El dinero sale de tu cuenta hoy.",
  },
];

export interface LoanWizardValues {
  timing: LoanTiming;
  borrower_name: string;
  principal: number;
  currency: string;
  lent_date: string;
  notes: string | null;
  /** Only a loan made *now* writes a matching Loan expense. */
  create_movement: boolean;
}

interface LoanWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  people?: string[];
  onSubmit: (values: LoanWizardValues) => Promise<unknown>;
}

/**
 * Añadir dinero prestado.
 *
 * Step 1 asks *when* the money left, because that single answer changes
 * everything downstream:
 *
 * - **Already lent** is an opening snapshot. The receivable exists, assets and
 *   net worth rise, and nothing happened this month. It must not create a
 *   movement, or the ledger gains a phantom expense on a date that already
 *   passed.
 * - **Lending now** moves cash into a receivable. Total assets and net worth
 *   are unchanged; available money drops; a Loan-category expense is written
 *   so Movements reflects the cash actually leaving.
 */
export function LoanWizard({
  open,
  onOpenChange,
  people = [],
  onSubmit,
}: LoanWizardProps) {
  const { t } = useLocale();
  const { baseCurrency, convert } = useCurrency();

  const [step, setStep] = useState<Step>("type");
  const [timing, setTiming] = useState<LoanTiming | null>(null);
  const [borrower, setBorrower] = useState("");
  const [principal, setPrincipal] = useState("");
  const [currency, setCurrency] = useState<string>(baseCurrency);
  const [lentDate, setLentDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("type");
    setTiming(null);
    setBorrower("");
    setPrincipal("");
    setCurrency(baseCurrency);
    setLentDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setConfirmDiscard(false);
  }, [open, baseCurrency]);

  const parsedPrincipal = parseDecimalInput(principal);
  const isDirty =
    timing !== null || borrower.trim() !== "" || principal.trim() !== "";
  const configValid = borrower.trim().length > 0 && parsedPrincipal !== null;

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
    event: timing === "now" ? "lend_money_now" : "opening_receivable",
    amount: convert(parsedPrincipal ?? 0, currency),
    includeInAvailable: false,
  });

  async function handleCreate() {
    if (!timing || parsedPrincipal === null) return;
    setSubmitting(true);
    try {
      await onSubmit({
        timing,
        borrower_name: borrower.trim(),
        principal: parsedPrincipal,
        currency,
        lent_date: lentDate,
        notes: notes.trim() || null,
        create_movement: timing === "now",
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

  const body = confirmDiscard ? (
    discard.body
  ) : step === "type" ? (
    <div className="space-y-1">
      <TypeStep
        options={OPTIONS}
        value={timing}
        onChange={setTiming}
        accent={PALETTE.wealth.lent}
        label={t("When did the money leave?", "¿Cuándo salió el dinero?")}
      />
      {timing && (
        <p className="px-5 pb-5 text-caption text-muted-foreground sm:px-6">
          {timing === "existing"
            ? t(
                "It will be recorded as an existing asset. Your current balance will not change.",
                "Se registrará como un activo existente; no reducirá tu saldo actual."
              )
            : t(
                "A Loan expense will be recorded so Movements shows the cash leaving.",
                "Se registrará un gasto de Préstamo para que Movimientos refleje la salida."
              )}
        </p>
      )}
    </div>
  ) : step === "config" ? (
    <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-6">
      <div className="min-w-0 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="loan-wizard-borrower">
              {t("Person or entity", "Persona o entidad")}
            </Label>
            <Input
              id="loan-wizard-borrower"
              list="loan-wizard-people"
              value={borrower}
              onChange={(event) => setBorrower(event.target.value)}
              placeholder={t("Carlos", "Carlos")}
            />
            <datalist id="loan-wizard-people">
              {people.map((person) => (
                <option key={person} value={person} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loan-wizard-principal">
              {timing === "now"
                ? t("Amount", "Importe")
                : t("Outstanding amount", "Saldo pendiente")}
            </Label>
            <Input
              id="loan-wizard-principal"
              inputMode="decimal"
              value={principal}
              onChange={(event) => setPrincipal(event.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loan-wizard-currency">
              {t("Currency", "Moneda")}
            </Label>
            <Select
              value={currency}
              onValueChange={(next) => next && setCurrency(next)}
            >
              <SelectTrigger id="loan-wizard-currency">
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
            <Label htmlFor="loan-wizard-date">
              {t("Date lent", "Fecha del préstamo")}
            </Label>
            <Input
              id="loan-wizard-date"
              type="date"
              value={lentDate}
              onChange={(event) => setLentDate(event.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="loan-wizard-notes">
              {t("Description (optional)", "Descripción (opcional)")}
            </Label>
            <Input
              id="loan-wizard-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("Personal loan", "Préstamo personal")}
            />
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-0">
        <div className="rounded-2xl bg-secondary/40 p-4 ring-1 ring-border/50">
          <p className="label-caps text-muted-foreground">
            {t("Preview", "Vista previa")}
          </p>
          <div className="mt-3 space-y-1">
            <p className="truncate text-body font-medium">
              {borrower.trim() || t("Borrower", "Prestatario")}
            </p>
            <p className="text-caption text-muted-foreground">
              {t("Outstanding", "Pendiente")}
            </p>
            <p className="font-mono text-title font-semibold tabular-nums">
              {formatCurrency(parsedPrincipal ?? 0, currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="space-y-4 px-5 py-5 sm:px-6">
      <ReviewTable>
        <ReviewRow
          label={t("When", "Cuándo")}
          value={
            timing === "now"
              ? t("Lending it now", "Voy a prestarlo ahora")
              : t("Already lent", "Ya fue prestado")
          }
        />
        <ReviewRow
          label={t("Person", "Persona")}
          value={borrower.trim()}
        />
        <ReviewRow
          label={t("Outstanding", "Saldo pendiente")}
          value={formatCurrency(parsedPrincipal ?? 0, currency)}
        />
        <ReviewRow label={t("Date lent", "Fecha")} value={lentDate} />
      </ReviewTable>

      <FinancialImpact impact={impact} flow="expense" />

      <p className="text-caption text-muted-foreground">
        {timing === "now"
          ? t(
              "Lending moves money between your own assets — cash falls, the receivable rises — so your net worth does not change. It is not an expense.",
              "Prestar mueve dinero entre tus propios activos — baja el efectivo, sube lo que te deben — así que tu patrimonio no cambia. No es un gasto."
            )
          : t(
              "This is an opening snapshot of what you are already owed. It is not income, and it will not change this month's figures.",
              "Esto es una foto de lo que ya te deben. No es un ingreso y no cambiará las cifras de este mes."
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
          {t("Record loan", "Registrar préstamo")}
        </Button>
      ) : (
        <Button
          onClick={() => setStep(step === "type" ? "config" : "review")}
          disabled={step === "type" ? timing === null : !configValid}
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
      title={t("Add money lent", "Añadir dinero prestado")}
      description={t(
        "Record money another person owes you.",
        "Registra dinero que otra persona te debe."
      )}
      steps={steps}
      step={step}
      body={body}
      footer={footer}
      submitting={submitting}
    />
  );
}
