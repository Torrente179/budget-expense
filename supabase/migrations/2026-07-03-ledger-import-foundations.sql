-- ============================================
-- Import foundations: provenance columns, import batches, categorization rules
-- Apply to BOTH Supabase projects (ledger + app): the API falls back to the
-- app project when SUPABASE_SERVICE_ROLE_KEY is unset, so both need the shape.
-- ============================================

-- 1. Provenance columns on expenses
ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS source_kind TEXT NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS external_ref TEXT,
    ADD COLUMN IF NOT EXISTS import_batch_id UUID,
    ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
    ALTER TABLE public.expenses
        ADD CONSTRAINT expenses_source_kind_check
        CHECK (source_kind IN ('manual', 'import_csv', 'import_script', 'recurring'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_external_ref_unique
    ON public.expenses(user_id, external_ref)
    WHERE external_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_import_batch
    ON public.expenses(import_batch_id)
    WHERE import_batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_needs_review
    ON public.expenses(user_id)
    WHERE needs_review;

-- 2. Provenance columns on income entries
ALTER TABLE public.income_entries
    ADD COLUMN IF NOT EXISTS source_kind TEXT NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS external_ref TEXT,
    ADD COLUMN IF NOT EXISTS import_batch_id UUID,
    ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
    ALTER TABLE public.income_entries
        ADD CONSTRAINT income_entries_source_kind_check
        CHECK (source_kind IN ('manual', 'import_csv', 'import_script', 'recurring'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_income_entries_external_ref_unique
    ON public.income_entries(user_id, external_ref)
    WHERE external_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_income_entries_import_batch
    ON public.income_entries(import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- 3. Import batches (JSONB staging payload lives on the batch row)
CREATE TABLE IF NOT EXISTS public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_format TEXT NOT NULL CHECK (source_format IN ('santander_csv', 'wise_csv')),
    filename TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'committed', 'rolled_back', 'discarded')),
    rows JSONB NOT NULL DEFAULT '[]'::jsonb,
    new_count INTEGER NOT NULL DEFAULT 0,
    duplicate_count INTEGER NOT NULL DEFAULT 0,
    uncategorized_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    committed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_batches_user
    ON public.import_batches(user_id, created_at DESC);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own import batches"
        ON public.import_batches FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own import batches"
        ON public.import_batches FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own import batches"
        ON public.import_batches FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own import batches"
        ON public.import_batches FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 4. Categorization rules (seeded from the Python import script, extended by user)
CREATE TABLE IF NOT EXISTS public.categorization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_type TEXT NOT NULL CHECK (match_type IN ('merchant_keyword', 'bank_category')),
    pattern TEXT NOT NULL CHECK (char_length(btrim(pattern)) > 0),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL DEFAULT 100,
    source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('seed', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, match_type, pattern)
);

CREATE INDEX IF NOT EXISTS idx_categorization_rules_user
    ON public.categorization_rules(user_id, match_type, priority);

ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own categorization rules"
        ON public.categorization_rules FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own categorization rules"
        ON public.categorization_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own categorization rules"
        ON public.categorization_rules FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own categorization rules"
        ON public.categorization_rules FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
