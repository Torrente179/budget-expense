"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  investmentCashMovementSchema,
  type InvestmentCashMovementFormValues,
} from "@/lib/validations";
import { CURRENCIES } from "@/lib/constants";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRightLeft, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";

interface BrokerageAccountOption {
  id: string;
  broker_kind: string;
  name: string;
  account_currency: string;
  fee_currency: string;
}

interface CashMovementFormProps {
  accounts: BrokerageAccountOption[];
  onSubmit: (values: InvestmentCashMovementFormValues) => Promise<unknown>;
  defaultValues?: Partial<InvestmentCashMovementFormValues>;
  trigger?: React.ReactNode;
}

function getDefaults(defaultValues?: Partial<InvestmentCashMovementFormValues>) {
  return {
    account_id: defaultValues?.account_id ?? "",
    movement_type: defaultValues?.movement_type ?? "deposit",
    movement_date:
      defaultValues?.movement_date ?? format(new Date(), "yyyy-MM-dd"),
    amount: defaultValues?.amount ?? (undefined as unknown as number),
    currency: defaultValues?.currency ?? "USD",
    fee_amount: defaultValues?.fee_amount ?? 0,
    fee_currency: defaultValues?.fee_currency ?? "USD",
    notes: defaultValues?.notes ?? "",
  } satisfies InvestmentCashMovementFormValues;
}

export function CashMovementForm({
  accounts,
  onSubmit,
  defaultValues,
  trigger,
}: CashMovementFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<InvestmentCashMovementFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(investmentCashMovementSchema) as any,
    defaultValues: getDefaults(defaultValues),
  });

  const accountId = form.watch("account_id");
  const selectedAccount = accounts.find((account) => account.id === accountId);

  useEffect(() => {
    if (!open) return;
    form.reset(getDefaults(defaultValues));
  }, [defaultValues, form, open]);

  useEffect(() => {
    if (!selectedAccount) return;
    if (!form.getValues("currency")) {
      form.setValue("currency", selectedAccount.account_currency);
    }
    if (!form.getValues("fee_currency")) {
      form.setValue("fee_currency", selectedAccount.fee_currency);
    }
  }, [form, selectedAccount]);

  async function handleSubmit(values: InvestmentCashMovementFormValues) {
    setSubmitting(true);
    const error = await onSubmit(values);
    setSubmitting(false);

    if (!error) {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : (
        <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
          <Plus className="h-4 w-4" />
          Add cash movement
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="space-y-3">
          <DialogTitle>
            {defaultValues ? "Edit cash movement" : "Add cash movement"}
          </DialogTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Record deposits and withdrawals without mixing them into the budget
            ledger.
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="movement-account">Brokerage account</Label>
            <Select
              value={accountId}
              onValueChange={(value) =>
                value &&
                form.setValue("account_id", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="movement-account" className="h-11">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} · {account.broker_kind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="movement-type">Type</Label>
              <Select
                value={form.watch("movement_type")}
                onValueChange={(value) =>
                  value &&
                  form.setValue(
                    "movement_type",
                    value as "deposit" | "withdrawal",
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    }
                  )
                }
              >
                <SelectTrigger id="movement-type" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-date">Date</Label>
              <Input
                id="movement-date"
                type="date"
                className="h-11"
                {...form.register("movement_date")}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="movement-amount">Amount</Label>
              <Input
                id="movement-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="h-11 font-mono"
                {...form.register("amount")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="movement-currency">Currency</Label>
              <Select
                value={form.watch("currency")}
                onValueChange={(value) =>
                  value &&
                  form.setValue("currency", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="movement-currency" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="movement-fee">Fee amount</Label>
              <Input
                id="movement-fee"
                type="number"
                step="0.01"
                min="0"
                className="h-11 font-mono"
                {...form.register("fee_amount")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="movement-fee-currency">Fee currency</Label>
              <Select
                value={form.watch("fee_currency")}
                onValueChange={(value) =>
                  value &&
                  form.setValue("fee_currency", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="movement-fee-currency" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement-notes">Notes</Label>
            <Input
              id="movement-notes"
              placeholder="Wire transfer, local bank withdrawal..."
              className="h-11"
              {...form.register("notes")}
            />
          </div>

          <div className="rounded-[1.3rem] border border-border/70 bg-secondary/35 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <ArrowRightLeft className="h-4 w-4" />
              Cash movements stay inside the investment ledger.
            </div>
            <p className="mt-2 leading-6">
              Deposits and withdrawals affect account cash and contribution
              tracking, but they do not change your expense budget.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {defaultValues ? "Save movement" : "Create movement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
