-- ============================================
-- Loans (money lent to others / receivables)
-- Apply to the APP project (same place as liabilities).
-- Outstanding = principal − Σ repayments.
-- Dual-write links expense_id / income_entry_id are optional.
-- ============================================

CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    borrower_name TEXT NOT NULL
        CHECK (char_length(btrim(borrower_name)) > 0 AND char_length(borrower_name) <= 120),
    principal DECIMAL(14, 2) NOT NULL CHECK (principal >= 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    lent_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loans_user
    ON public.loans(user_id, is_active);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own loans"
        ON public.loans FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own loans"
        ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own loans"
        ON public.loans FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own loans"
        ON public.loans FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.loan_repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    repayment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(14, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    note TEXT,
    income_entry_id UUID REFERENCES public.income_entries(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan
    ON public.loan_repayments(loan_id, repayment_date);

CREATE INDEX IF NOT EXISTS idx_loan_repayments_user
    ON public.loan_repayments(user_id);

ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own loan repayments"
        ON public.loan_repayments FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own loan repayments"
        ON public.loan_repayments FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own loan repayments"
        ON public.loan_repayments FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own loan repayments"
        ON public.loan_repayments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
