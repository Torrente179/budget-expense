-- Investment savings accounts and transfer tracking from main balance

CREATE TABLE IF NOT EXISTS public.investment_savings_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL CHECK (country_code IN ('CO', 'ES')),
    bank_code TEXT NOT NULL CHECK (
        char_length(btrim(bank_code)) > 0
        AND char_length(btrim(bank_code)) <= 48
    ),
    bank_name TEXT NOT NULL CHECK (
        char_length(btrim(bank_name)) > 0
        AND char_length(btrim(bank_name)) <= 140
    ),
    product_type TEXT NOT NULL CHECK (
        product_type IN ('savings_account', 'checking_account', 'fiduciary_account')
    ),
    product_name TEXT NOT NULL CHECK (
        char_length(btrim(product_name)) > 0
        AND char_length(btrim(product_name)) <= 140
    ),
    account_name TEXT NOT NULL CHECK (
        char_length(btrim(account_name)) > 0
        AND char_length(btrim(account_name)) <= 140
    ),
    currency TEXT NOT NULL CHECK (char_length(currency) = 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_savings_accounts_user_id
    ON public.investment_savings_accounts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.investment_savings_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    savings_account_id UUID NOT NULL REFERENCES public.investment_savings_accounts(id) ON DELETE CASCADE,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(18, 8) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL CHECK (char_length(currency) = 3),
    notes TEXT,
    source_kind TEXT NOT NULL DEFAULT 'manual'
        CHECK (source_kind IN ('manual', 'expense_flow')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_savings_transfers_user_date
    ON public.investment_savings_transfers(user_id, transfer_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investment_savings_transfers_account
    ON public.investment_savings_transfers(user_id, savings_account_id, transfer_date DESC);

ALTER TABLE public.investment_savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_savings_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own investment savings accounts" ON public.investment_savings_accounts;
CREATE POLICY "Users can view own investment savings accounts"
    ON public.investment_savings_accounts FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own investment savings accounts" ON public.investment_savings_accounts;
CREATE POLICY "Users can insert own investment savings accounts"
    ON public.investment_savings_accounts FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own investment savings accounts" ON public.investment_savings_accounts;
CREATE POLICY "Users can update own investment savings accounts"
    ON public.investment_savings_accounts FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own investment savings accounts" ON public.investment_savings_accounts;
CREATE POLICY "Users can delete own investment savings accounts"
    ON public.investment_savings_accounts FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own investment savings transfers" ON public.investment_savings_transfers;
CREATE POLICY "Users can view own investment savings transfers"
    ON public.investment_savings_transfers FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own investment savings transfers" ON public.investment_savings_transfers;
CREATE POLICY "Users can insert own investment savings transfers"
    ON public.investment_savings_transfers FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own investment savings transfers" ON public.investment_savings_transfers;
CREATE POLICY "Users can update own investment savings transfers"
    ON public.investment_savings_transfers FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own investment savings transfers" ON public.investment_savings_transfers;
CREATE POLICY "Users can delete own investment savings transfers"
    ON public.investment_savings_transfers FOR DELETE USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS set_updated_at_investment_savings_accounts ON public.investment_savings_accounts;
CREATE TRIGGER set_updated_at_investment_savings_accounts
    BEFORE UPDATE ON public.investment_savings_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_investment_savings_transfers ON public.investment_savings_transfers;
CREATE TRIGGER set_updated_at_investment_savings_transfers
    BEFORE UPDATE ON public.investment_savings_transfers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
