-- ============================================
-- Savings goals and availability
--
-- The Ahorros mockup shows each fund against a target ("5.200 € de 7.500 €,
-- 69% completado") and distinguishes money that is still spendable from money
-- reserved for a goal. `investment_savings_accounts` had neither column, so
-- both were impossible to express.
--
-- `target_amount` is optional: a plain savings account has no goal, and a
-- fund without a target must not render as 0% complete.
--
-- `include_in_available` affects the *available money* figure only. Net worth
-- always counts the fund — reserving money does not make it stop being yours.
-- Default false, because money deliberately set aside is not spending money;
-- that is the whole point of setting it aside.
-- ============================================

ALTER TABLE public.investment_savings_accounts
    ADD COLUMN IF NOT EXISTS target_amount DECIMAL(16, 2)
        CHECK (target_amount IS NULL OR target_amount >= 0);

ALTER TABLE public.investment_savings_accounts
    ADD COLUMN IF NOT EXISTS include_in_available BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.investment_savings_accounts
    ADD COLUMN IF NOT EXISTS target_date DATE;

COMMENT ON COLUMN public.investment_savings_accounts.target_amount IS
    'Optional goal. NULL means the fund has no target and shows no progress bar.';
COMMENT ON COLUMN public.investment_savings_accounts.include_in_available IS
    'Counts toward spendable money. Net worth includes the fund either way.';
