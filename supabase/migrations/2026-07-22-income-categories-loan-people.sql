-- ============================================
-- Income categories + loan people (counterparties)
-- ============================================

-- 1. Categories can apply to expenses, incomes, or both
ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS applies_to TEXT NOT NULL DEFAULT 'expense';

DO $$ BEGIN
    ALTER TABLE public.categories
        ADD CONSTRAINT categories_applies_to_check
        CHECK (applies_to IN ('expense', 'income', 'both'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

UPDATE public.categories
SET applies_to = 'both'
WHERE user_id IS NULL
  AND lower(btrim(name)) = 'loan'
  AND applies_to IS DISTINCT FROM 'both';

-- Income-only defaults
INSERT INTO public.categories (user_id, name, icon, color, is_default, classification, applies_to)
SELECT NULL, 'Salary', 'banknote', '#15803d', true, 'discretionary', 'income'
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE user_id IS NULL AND lower(btrim(name)) = 'salary'
);

INSERT INTO public.categories (user_id, name, icon, color, is_default, classification, applies_to)
SELECT NULL, 'Other Income', 'circle-dollar-sign', '#64748b', true, 'discretionary', 'income'
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE user_id IS NULL AND lower(btrim(name)) = 'other income'
);

-- 2. Optional category on income entries
ALTER TABLE public.income_entries
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_income_entries_category
    ON public.income_entries(category_id);

-- 3. People you have lent to (for pickers)
CREATE TABLE IF NOT EXISTS public.loan_people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL
        CHECK (char_length(btrim(name)) > 0 AND char_length(name) <= 120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_loan_people_user_name_unique
    ON public.loan_people (user_id, lower(btrim(name)));

CREATE INDEX IF NOT EXISTS idx_loan_people_user
    ON public.loan_people(user_id, name);

ALTER TABLE public.loan_people ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own loan people"
        ON public.loan_people FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own loan people"
        ON public.loan_people FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own loan people"
        ON public.loan_people FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own loan people"
        ON public.loan_people FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Backfill people from existing loans
INSERT INTO public.loan_people (user_id, name)
SELECT DISTINCT ON (user_id, lower(btrim(borrower_name)))
    user_id,
    btrim(borrower_name)
FROM public.loans
WHERE char_length(btrim(borrower_name)) > 0
ON CONFLICT DO NOTHING;
