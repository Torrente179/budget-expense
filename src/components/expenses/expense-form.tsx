"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormValues } from "@/lib/validations";
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
import { format } from "date-fns";

interface ExpenseFormProps {
  onSubmit: (values: ExpenseFormValues) => Promise<unknown>;
  defaultValues?: Partial<ExpenseFormValues>;
  trigger?: React.ReactNode;
}

export function ExpenseForm({ onSubmit, defaultValues, trigger }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { baseCurrency } = useCurrency();
  const { categories } = useCategories();

  const form = useForm<ExpenseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      amount: defaultValues?.amount ?? (undefined as unknown as number),
      currency: defaultValues?.currency ?? baseCurrency,
      category_id: defaultValues?.category_id ?? "",
      description: defaultValues?.description ?? "",
      date: defaultValues?.date ?? format(new Date(), "yyyy-MM-dd"),
    },
  });

  async function handleSubmit(values: ExpenseFormValues) {
    setSubmitting(true);
    const error = await onSubmit(values);
    setSubmitting(false);
    if (!error) {
      setOpen(false);
      form.reset({
        amount: undefined as unknown as number,
        currency: baseCurrency,
        category_id: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
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
          Add expense
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {defaultValues?.amount ? "Edit expense" : "Add expense"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
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
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.watch("currency")}
                onValueChange={(v) => v && form.setValue("currency", v)}
              >
                <SelectTrigger id="currency" className="font-mono text-sm">
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

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.watch("category_id")}
              onValueChange={(v) => v && form.setValue("category_id", v)}
            >
              <SelectTrigger id="category">
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

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...form.register("date")} />
            {form.formState.errors.date && (
              <p className="text-xs text-destructive">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="description"
              placeholder="What was this expense for?"
              {...form.register("description")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {defaultValues?.amount ? "Save changes" : "Add expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
