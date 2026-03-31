import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3),
  category_id: z.string().uuid("Please select a category"),
  description: z.string().max(255).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export type ExpenseFormValues = z.output<typeof expenseSchema>;

export const budgetSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3),
  category_id: z.string().uuid("Please select a category"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});

export type BudgetFormValues = z.output<typeof budgetSchema>;

export const profileSchema = z.object({
  display_name: z.string().min(1, "Name is required").max(100),
  base_currency: z.string().min(3).max(3),
});

export type ProfileFormValues = z.output<typeof profileSchema>;
