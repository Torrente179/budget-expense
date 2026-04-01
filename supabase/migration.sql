-- ============================================
-- Budget & Expense Tracker — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Profiles (extends Supabase Auth)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    base_currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 2. Categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'circle',
    color TEXT NOT NULL DEFAULT '#6366f1',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_user_id ON public.categories(user_id);

-- 3. Expenses
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(user_id, date);
CREATE INDEX idx_expenses_category ON public.expenses(user_id, category_id);

-- 4. Budgets
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, category_id, month, year)
);

CREATE INDEX idx_budgets_user_period ON public.budgets(user_id, year, month);

-- 5. Monthly budget plans
CREATE TABLE public.monthly_budget_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    income_amount DECIMAL(12, 2) NOT NULL CHECK (income_amount > 0),
    income_currency TEXT NOT NULL DEFAULT 'EUR',
    allocation_percent DECIMAL(5, 2) NOT NULL DEFAULT 20 CHECK (allocation_percent > 0 AND allocation_percent <= 100),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, month, year)
);

CREATE INDEX idx_monthly_budget_plans_user_period
    ON public.monthly_budget_plans(user_id, year, month);

-- 6. Seed default categories
INSERT INTO public.categories (user_id, name, icon, color, is_default) VALUES
    (NULL, 'Food & Dining',    'utensils',       '#ef4444', true),
    (NULL, 'Transportation',    'car',            '#f97316', true),
    (NULL, 'Housing',           'home',           '#eab308', true),
    (NULL, 'Utilities',         'zap',            '#84cc16', true),
    (NULL, 'Entertainment',     'film',           '#06b6d4', true),
    (NULL, 'Shopping',          'shopping-bag',   '#8b5cf6', true),
    (NULL, 'Healthcare',        'heart-pulse',    '#ec4899', true),
    (NULL, 'Education',         'graduation-cap', '#6366f1', true),
    (NULL, 'Travel',            'plane',          '#14b8a6', true),
    (NULL, 'Subscriptions',     'repeat',         '#f43f5e', true),
    (NULL, 'Groceries',         'shopping-cart',  '#22c55e', true),
    (NULL, 'Other',             'more-horizontal','#64748b', true);

-- 7. Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_expenses
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_budgets
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_monthly_budget_plans
    BEFORE UPDATE ON public.monthly_budget_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. Monthly expense summary view
CREATE OR REPLACE VIEW public.monthly_expense_summary AS
SELECT
    e.user_id,
    EXTRACT(YEAR FROM e.date)::int AS year,
    EXTRACT(MONTH FROM e.date)::int AS month,
    e.category_id,
    c.name AS category_name,
    c.color AS category_color,
    c.icon AS category_icon,
    e.currency,
    SUM(e.amount) AS total_amount,
    COUNT(*) AS expense_count
FROM public.expenses e
JOIN public.categories c ON c.id = e.category_id
GROUP BY e.user_id, EXTRACT(YEAR FROM e.date), EXTRACT(MONTH FROM e.date),
         e.category_id, c.name, c.color, c.icon, e.currency;

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budget_plans ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories
CREATE POLICY "Users can view default and own categories"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users can insert own categories"
    ON public.categories FOR INSERT
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own categories"
    ON public.categories FOR UPDATE
    USING (user_id = auth.uid() AND is_default = false);
CREATE POLICY "Users can delete own categories"
    ON public.categories FOR DELETE
    USING (user_id = auth.uid() AND is_default = false);

-- Expenses
CREATE POLICY "Users can view own expenses"
    ON public.expenses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own expenses"
    ON public.expenses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own expenses"
    ON public.expenses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own expenses"
    ON public.expenses FOR DELETE USING (user_id = auth.uid());

-- Budgets
CREATE POLICY "Users can view own budgets"
    ON public.budgets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own budgets"
    ON public.budgets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own budgets"
    ON public.budgets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own budgets"
    ON public.budgets FOR DELETE USING (user_id = auth.uid());

-- Monthly budget plans
CREATE POLICY "Users can view own monthly budget plans"
    ON public.monthly_budget_plans FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own monthly budget plans"
    ON public.monthly_budget_plans FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own monthly budget plans"
    ON public.monthly_budget_plans FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own monthly budget plans"
    ON public.monthly_budget_plans FOR DELETE USING (user_id = auth.uid());
