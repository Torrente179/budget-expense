"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetSchema, type BudgetFormValues } from "@/lib/validations";
import { useCurrency } from "@/providers/currency-provider";
import { useCategories } from "@/hooks/use-categories";
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
import { CURRENCIES } from "@/lib/constants";
import { Loader2, Plus } from "lucide-react";
import { CategoryIcon } from "@/components/shared/category-badge";

interface BudgetFormProps {
  month: number;
  year: number;
  onSubmit: (values: BudgetFormValues) => Promise<unknown>;
  defaultValues?: Partial<BudgetFormValues>;
  trigger?: React.ReactNode;
}

export function BudgetForm({
  month,
  year,
  onSubmit,
  defaultValues,
  trigger,
}: BudgetFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { baseCurrency } = useCurrency();
  const { categories } = useCategories();

  const form = useForm<BudgetFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(budgetSchema) as any,
    defaultValues: {
      amount: defaultValues?.amount ?? (undefined as unknown as number),
      currency: defaultValues?.currency ?? baseCurrency,
      category_id: defaultValues?.category_id ?? "",
      month,
      year,
    },
  });

  async function handleSubmit(values: BudgetFormValues) {
    setSubmitting(true);
    const error = await onSubmit({ ...values, month, year });
    setSubmitting(false);
    if (!error) {
      setOpen(false);
      form.reset({
        amount: undefined as unknown as number,
        currency: baseCurrency,
        category_id: "",
        month,
        year,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger
          render={trigger as React.ReactElement}
        />
      ) : (
        <DialogTrigger
          render={
            <Button size="sm" className="gap-1.5" />
          }
        >
          <Plus className="h-4 w-4" />
          Add envelope
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[430px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-base">
            {defaultValues?.amount ? "Edit envelope" : "Set category envelope"}
          </DialogTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Use envelopes to reserve part of your monthly pool for a specific
            category without changing the overall plan.
          </p>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="budget-category">Category</Label>
            <Select
              value={form.watch("category_id")}
              onValueChange={(v) => v && form.setValue("category_id", v)}
            >
              <SelectTrigger id="budget-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        icon={cat.icon}
                        color={cat.color}
                        className="h-5 w-5"
                      />
                      <span className="text-sm">{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category_id && (
              <p className="text-xs text-destructive">
                {form.formState.errors.category_id.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="budget-amount">Envelope amount</Label>
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="font-mono"
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-currency">Currency</Label>
              <Select
                value={form.watch("currency")}
                onValueChange={(v) => v && form.setValue("currency", v)}
              >
                <SelectTrigger id="budget-currency" className="font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="text-sm">
                      {c.flag} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {defaultValues?.amount ? "Save envelope" : "Create envelope"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
