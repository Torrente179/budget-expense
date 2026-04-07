-- ============================================================
-- Custom Budgets: named budgets with multiple categories
-- ============================================================

-- 1. Tables
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.custom_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(btrim(name)) > 0 AND char_length(btrim(name)) <= 120),
    amount_type TEXT NOT NULL CHECK (amount_type IN ('fixed', 'percentage')),
    amount_value DECIMAL(12, 2) NOT NULL CHECK (amount_value > 0),
    currency TEXT NOT NULL DEFAULT 'EUR' CHECK (char_length(currency) = 3),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, name, month, year)
);

CREATE TABLE IF NOT EXISTS public.custom_budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_budget_id UUID NOT NULL REFERENCES public.custom_budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    UNIQUE(custom_budget_id, category_id)
);

-- 2. Indexes
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_custom_budgets_user_period
    ON public.custom_budgets(user_id, year, month);

CREATE INDEX IF NOT EXISTS idx_custom_budget_categories_budget
    ON public.custom_budget_categories(custom_budget_id);

-- 3. Triggers
-- ------------------------------------------------------------

CREATE TRIGGER set_custom_budgets_updated_at
    BEFORE UPDATE ON public.custom_budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- 4. Row-Level Security
-- ------------------------------------------------------------

ALTER TABLE public.custom_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_budget_categories ENABLE ROW LEVEL SECURITY;

-- custom_budgets policies (standard user-scoped pattern)
CREATE POLICY "Users can view own custom budgets"
    ON public.custom_budgets FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own custom budgets"
    ON public.custom_budgets FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own custom budgets"
    ON public.custom_budgets FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own custom budgets"
    ON public.custom_budgets FOR DELETE
    USING (user_id = auth.uid());

-- custom_budget_categories policies (subquery through parent)
CREATE POLICY "Users can view own custom budget categories"
    ON public.custom_budget_categories FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.custom_budgets
        WHERE custom_budgets.id = custom_budget_categories.custom_budget_id
        AND custom_budgets.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own custom budget categories"
    ON public.custom_budget_categories FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.custom_budgets
        WHERE custom_budgets.id = custom_budget_categories.custom_budget_id
        AND custom_budgets.user_id = auth.uid()
    ));

CREATE POLICY "Users can update own custom budget categories"
    ON public.custom_budget_categories FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.custom_budgets
        WHERE custom_budgets.id = custom_budget_categories.custom_budget_id
        AND custom_budgets.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own custom budget categories"
    ON public.custom_budget_categories FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.custom_budgets
        WHERE custom_budgets.id = custom_budget_categories.custom_budget_id
        AND custom_budgets.user_id = auth.uid()
    ));

-- 5. Reload PostgREST schema cache
-- ------------------------------------------------------------

NOTIFY pgrst, 'reload schema';
