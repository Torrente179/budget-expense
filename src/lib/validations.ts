import { z } from "zod";
import { parseDecimalInput } from "@/lib/utils";

const positiveAmountSchema = z.preprocess(
  (value) => parseDecimalInput(value),
  z.number({ error: "Enter a valid amount" }).positive("Amount must be greater than 0")
);

export const expenseSchema = z.object({
  amount: positiveAmountSchema,
  currency: z.string().min(3).max(3),
  category_id: z.string().uuid("Please select a category"),
  description: z.string().max(255).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export type ExpenseFormValues = z.output<typeof expenseSchema>;

export const recurringExpenseSchema = z.object({
  amount: positiveAmountSchema,
  currency: z.string().min(3).max(3),
  category_id: z.string().uuid("Please select a category"),
  description: z.string().max(255).optional(),
  charge_day: z.coerce
    .number()
    .int("Debit day must be a whole number")
    .min(1, "Debit day must be at least 1")
    .max(31, "Debit day cannot exceed 31"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  is_active: z.boolean().default(true),
});

export type RecurringExpenseFormValues = z.output<typeof recurringExpenseSchema>;

export const incomeSchema = z.object({
  amount: positiveAmountSchema,
  currency: z.string().min(3).max(3),
  source: z.string().min(1, "Source is required").max(100),
  description: z.string().max(255).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  category_id: z.string().uuid().nullable().optional(),
  /** When set with a Loan income, also records a loan repayment. */
  loan_id: z.string().uuid().optional(),
});

export type IncomeFormValues = z.output<typeof incomeSchema>;

export const budgetSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3),
  category_id: z.string().uuid("Please select a category"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});

export type BudgetFormValues = z.output<typeof budgetSchema>;

export const customBudgetSchema = z
  .object({
    name: z.string().min(1, "Budget name is required").max(120),
    amount_type: z.enum(["fixed", "percentage"]),
    amount_value: z.coerce.number().positive("Amount must be greater than 0"),
    currency: z.string().min(3).max(3),
    category_ids: z
      .array(z.string().uuid())
      .min(1, "Select at least one category"),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2020).max(2100),
  })
  .refine(
    (data) => data.amount_type !== "percentage" || data.amount_value <= 100,
    {
      message: "Percentage cannot exceed 100%",
      path: ["amount_value"],
    }
  );

export type CustomBudgetFormValues = z.output<typeof customBudgetSchema>;

/** DB column is NOT NULL; product no longer exposes a protected allocation %. */
export const MONTHLY_PLAN_FULL_ALLOCATION = 100;

export const monthlyBudgetPlanSchema = z.object({
  income_amount: z.coerce.number().positive("Income must be greater than 0"),
  income_currency: z.string().min(3).max(3),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});

export type MonthlyBudgetPlanFormValues = z.output<
  typeof monthlyBudgetPlanSchema
>;

export const profileSchema = z.object({
  display_name: z.string().min(1, "Name is required").max(100),
  base_currency: z.string().min(3).max(3),
});

export type ProfileFormValues = z.output<typeof profileSchema>;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

const optionalUuid = z.string().uuid().optional().or(z.literal(""));

export const brokerKindSchema = z
  .string()
  .max(80)
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, "Broker is required");
export const feeModeSchema = z.enum([
  "manual",
  "percent",
  "fixed",
  "percent_plus_fixed",
]);
export const assetTypeSchema = z.enum(["stock", "etf", "crypto"]);
export const marketCodeSchema = z.enum(["US", "CO", "CRYPTO"]);
export const tradeSideSchema = z.enum(["buy", "sell"]);
export const movementTypeSchema = z.enum(["deposit", "withdrawal"]);
export const savingsCountrySchema = z.enum(["CO", "ES"]);
export const savingsProductTypeSchema = z.enum([
  "savings_account",
  "checking_account",
  "fiduciary_account",
]);
export const referenceStatusSchema = z.enum([
  "fetched",
  "fallback_previous_trading_day",
  "unavailable",
  "manual_only",
]);

export const brokerageAccountSchema = z.object({
  broker_kind: brokerKindSchema,
  name: z.string().min(1, "Account name is required").max(120),
  account_currency: z.string().min(3).max(3),
  fee_mode: feeModeSchema,
  fee_percent: z.coerce.number().min(0),
  fee_fixed_amount: z.coerce.number().min(0),
  fee_min_amount: z.coerce.number().min(0),
  fee_currency: z.string().min(3).max(3),
});

export type BrokerageAccountFormValues = z.output<
  typeof brokerageAccountSchema
>;

export const investmentAssetSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(32)
    .transform((value) => value.trim().toUpperCase()),
  display_name: z.string().max(160).optional().or(z.literal("")),
  asset_type: assetTypeSchema,
  market_code: marketCodeSchema,
  exchange_code: z.string().max(16).optional().or(z.literal("")),
  quote_currency: z.string().min(3).max(3),
  provider_symbol_twelve: z.string().max(64).optional().or(z.literal("")),
  provider_symbol_eodhd: z.string().max(64).optional().or(z.literal("")),
  is_price_supported: z.boolean().default(true),
});

export type InvestmentAssetFormValues = z.output<typeof investmentAssetSchema>;

export const investmentTradeSchema = z.object({
  account_id: optionalUuid,
  broker_name: brokerKindSchema,
  asset: investmentAssetSchema,
  side: tradeSideSchema,
  trade_date: isoDate,
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  execution_price: z.coerce
    .number()
    .positive("Execution price must be greater than 0"),
  execution_currency: z.string().min(3).max(3),
  fee_amount: z.coerce.number().min(0),
  fee_currency: z.string().min(3).max(3),
  notes: z.string().max(255).optional(),
  reference_close_price: z.coerce.number().min(0).optional().nullable(),
  reference_close_currency: z.string().min(3).max(3).optional().nullable(),
  reference_price_date: isoDate.optional().nullable(),
  reference_source: z.string().max(64).optional().nullable(),
  reference_status: referenceStatusSchema.default("manual_only"),
});

export type InvestmentTradeFormValues = z.output<typeof investmentTradeSchema>;

export const investmentCashMovementSchema = z.object({
  account_id: optionalUuid,
  broker_name: brokerKindSchema,
  movement_type: movementTypeSchema,
  movement_date: isoDate,
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3),
  fee_amount: z.coerce.number().min(0),
  fee_currency: z.string().min(3).max(3),
  notes: z.string().max(255).optional(),
});

export type InvestmentCashMovementFormValues = z.output<
  typeof investmentCashMovementSchema
>;

export const investmentSavingsAccountSchema = z.object({
  country_code: savingsCountrySchema,
  bank_code: z.string().min(1).max(48),
  bank_name: z.string().min(1).max(140),
  product_type: savingsProductTypeSchema,
  product_name: z.string().min(1).max(140),
  account_name: z.string().min(1).max(140),
  currency: z.string().min(3).max(3),
});

export type InvestmentSavingsAccountFormValues = z.output<
  typeof investmentSavingsAccountSchema
>;

export const investmentSavingsTransferSchema = z.object({
  savings_account_id: z.string().uuid("Please select a savings account"),
  transfer_date: isoDate,
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3),
  notes: z.string().max(255).optional(),
  source_kind: z.enum(["manual", "expense_flow"]).default("manual"),
});

export type InvestmentSavingsTransferFormValues = z.output<
  typeof investmentSavingsTransferSchema
>;

export const investmentWatchlistSchema = z.object({
  asset: investmentAssetSchema,
  note: z.string().max(255).optional(),
});

export type InvestmentWatchlistFormValues = z.output<
  typeof investmentWatchlistSchema
>;
