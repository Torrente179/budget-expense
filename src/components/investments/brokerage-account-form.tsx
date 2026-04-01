"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  brokerageAccountSchema,
  type BrokerageAccountFormValues,
} from "@/lib/validations";
import { CURRENCIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

interface BrokerageAccountFormProps {
  onSubmit: (values: BrokerageAccountFormValues) => Promise<unknown>;
  defaultValues?: Partial<BrokerageAccountFormValues>;
  trigger?: React.ReactNode;
}

export function BrokerageAccountForm({
  onSubmit,
  defaultValues,
  trigger,
}: BrokerageAccountFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BrokerageAccountFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(brokerageAccountSchema) as any,
    defaultValues: {
      broker_kind: defaultValues?.broker_kind ?? "IBKR",
      name: defaultValues?.name ?? "",
      account_currency: defaultValues?.account_currency ?? "USD",
      fee_mode: defaultValues?.fee_mode ?? "manual",
      fee_percent: defaultValues?.fee_percent ?? 0,
      fee_fixed_amount: defaultValues?.fee_fixed_amount ?? 0,
      fee_min_amount: defaultValues?.fee_min_amount ?? 0,
      fee_currency: defaultValues?.fee_currency ?? "USD",
    },
  });

  async function handleSubmit(values: BrokerageAccountFormValues) {
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
          Add account
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="space-y-3">
          <DialogTitle>
            {defaultValues ? "Edit brokerage account" : "Add brokerage account"}
          </DialogTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Store the broker, account currency, and fee defaults you want the
            trade forms to prefill.
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-broker-kind">Broker</Label>
              <Select
                value={form.watch("broker_kind")}
                onValueChange={(value) =>
                  value &&
                  form.setValue("broker_kind", value as "IBKR" | "HAPI", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="account-broker-kind" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IBKR">IBKR</SelectItem>
                  <SelectItem value="HAPI">Hapi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-name">Account name</Label>
              <Input
                id="account-name"
                placeholder="Main IBKR, Hapi cash..."
                className="h-11"
                {...form.register("name")}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-currency">Account currency</Label>
              <Select
                value={form.watch("account_currency")}
                onValueChange={(value) =>
                  value &&
                  form.setValue("account_currency", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="account-currency" className="h-11">
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

            <div className="space-y-2">
              <Label htmlFor="fee-mode">Fee mode</Label>
              <Select
                value={form.watch("fee_mode")}
                onValueChange={(value) =>
                  value &&
                  form.setValue(
                    "fee_mode",
                    value as
                      | "manual"
                      | "percent"
                      | "fixed"
                      | "percent_plus_fixed",
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    }
                  )
                }
              >
                <SelectTrigger id="fee-mode" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual only</SelectItem>
                  <SelectItem value="percent">Percent</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="percent_plus_fixed">
                    Percent + fixed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fee-percent">Fee percent</Label>
              <Input
                id="fee-percent"
                type="number"
                step="0.0001"
                min="0"
                className="h-11 font-mono"
                {...form.register("fee_percent")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-fixed">Fixed fee</Label>
              <Input
                id="fee-fixed"
                type="number"
                step="0.0001"
                min="0"
                className="h-11 font-mono"
                {...form.register("fee_fixed_amount")}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fee-min">Minimum fee</Label>
              <Input
                id="fee-min"
                type="number"
                step="0.0001"
                min="0"
                className="h-11 font-mono"
                {...form.register("fee_min_amount")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-currency">Fee currency</Label>
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
                <SelectTrigger id="fee-currency" className="h-11">
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {defaultValues ? "Save account" : "Create account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
