-- ============================================
-- Wealth accounts (Cuentas y efectivo)
-- Checking / savings / cash / digital wallet balances that make up the
-- liquid slice of net worth. Until now the app had no account model at all:
-- liquid money existed only as an append-only `balance_checkpoints`
-- reconciliation, and net worth excluded bank cash entirely.
--
-- Balance is DERIVED, never stored:
--   current = opening_balance + Σ wealth_account_movements.amount
-- matching the house pattern (liabilities.original_balance − Σ payments,
-- loans.principal − Σ repayments).
--
-- `is_primary` is the seam for reconciliation: a later change points the
-- Settings → Available balance flow at the primary account so the app stops
-- carrying two different figures for "my cash".
-- ============================================

CREATE TABLE IF NOT EXISTS public.wealth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'checking'
        CHECK (kind IN ('checking', 'savings', 'cash', 'digital_wallet', 'other')),
    name TEXT NOT NULL
        CHECK (char_length(btrim(name)) > 0 AND char_length(name) <= 120),
    institution TEXT
        CHECK (institution IS NULL OR char_length(institution) <= 120),
    currency TEXT NOT NULL DEFAULT 'EUR'
        CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
    opening_balance DECIMAL(14, 2) NOT NULL DEFAULT 0,
    opening_date DATE NOT NULL DEFAULT CURRENT_DATE,
    include_in_available BOOLEAN NOT NULL DEFAULT true,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    color TEXT CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
    icon TEXT CHECK (icon IS NULL OR char_length(icon) <= 48),
    notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 500),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'closed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wealth_accounts_user
    ON public.wealth_accounts(user_id, status);

-- At most one primary account per user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_wealth_accounts_one_primary
    ON public.wealth_accounts(user_id) WHERE is_primary;

ALTER TABLE public.wealth_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own wealth accounts"
        ON public.wealth_accounts FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own wealth accounts"
        ON public.wealth_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own wealth accounts"
        ON public.wealth_accounts FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own wealth accounts"
        ON public.wealth_accounts FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.wealth_accounts IS
    'Liquid accounts and cash. Balance is derived from opening_balance plus movements; include_in_available decides whether it counts as spendable money.';

-- ============================================

CREATE TABLE IF NOT EXISTS public.wealth_account_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.wealth_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL
        CHECK (movement_type IN ('opening_balance', 'transfer_in', 'transfer_out', 'adjustment')),
    -- Signed, like liability_payments.amount: negative reduces the balance.
    amount DECIMAL(14, 2) NOT NULL CHECK (amount <> 0),
    currency TEXT NOT NULL DEFAULT 'EUR'
        CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
    occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT CHECK (note IS NULL OR char_length(note) <= 500),
    linked_account_id UUID REFERENCES public.wealth_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wealth_account_movements_account
    ON public.wealth_account_movements(account_id, occurred_on DESC);

CREATE INDEX IF NOT EXISTS idx_wealth_account_movements_user
    ON public.wealth_account_movements(user_id, occurred_on DESC);

ALTER TABLE public.wealth_account_movements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own wealth account movements"
        ON public.wealth_account_movements FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own wealth account movements"
        ON public.wealth_account_movements FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own wealth account movements"
        ON public.wealth_account_movements FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own wealth account movements"
        ON public.wealth_account_movements FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.wealth_account_movements IS
    'Signed balance deltas for a wealth account. Transfers between own accounts set linked_account_id; they move money without being income or expense.';
