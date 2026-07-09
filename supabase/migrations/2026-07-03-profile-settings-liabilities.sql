-- ============================================
-- Profile stewardship settings + liabilities tracking
-- Apply to the APP project only (profiles, liabilities live with app data).
-- ============================================

-- 1. Stewardship settings on profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS tithe_target_percent DECIMAL(5, 2) NOT NULL DEFAULT 10
        CHECK (tithe_target_percent >= 0 AND tithe_target_percent <= 100),
    ADD COLUMN IF NOT EXISTS manual_fx_rates JSONB;

-- 2. Liabilities (loans, mortgages, credit balances)
CREATE TABLE IF NOT EXISTS public.liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(btrim(name)) > 0 AND char_length(name) <= 120),
    kind TEXT NOT NULL DEFAULT 'loan'
        CHECK (kind IN ('loan', 'mortgage', 'credit_card', 'personal', 'other')),
    original_balance DECIMAL(14, 2) NOT NULL CHECK (original_balance >= 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    interest_rate_percent DECIMAL(6, 3),
    opened_date DATE,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_liabilities_user
    ON public.liabilities(user_id, is_active);

ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own liabilities"
        ON public.liabilities FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own liabilities"
        ON public.liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own liabilities"
        ON public.liabilities FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own liabilities"
        ON public.liabilities FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Liability payments (current balance = original_balance − Σ payments;
--    negative amounts allowed as manual balance adjustments upward)
CREATE TABLE IF NOT EXISTS public.liability_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    liability_id UUID NOT NULL REFERENCES public.liabilities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(14, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_liability_payments_liability
    ON public.liability_payments(liability_id, payment_date);

ALTER TABLE public.liability_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own liability payments"
        ON public.liability_payments FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own liability payments"
        ON public.liability_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own liability payments"
        ON public.liability_payments FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own liability payments"
        ON public.liability_payments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
