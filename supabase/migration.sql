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

-- 4. Recurring expenses
CREATE TABLE public.recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    description TEXT,
    charge_day INTEGER NOT NULL CHECK (charge_day BETWEEN 1 AND 31),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_expenses_user_active
    ON public.recurring_expenses(user_id, is_active, charge_day);

ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS recurring_expense_id UUID REFERENCES public.recurring_expenses(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS recurring_month DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_recurring_month_unique
    ON public.expenses(user_id, recurring_expense_id, recurring_month);

-- 5. Income entries
CREATE TABLE public.income_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (char_length(btrim(source)) > 0 AND char_length(source) <= 100),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_income_entries_user_id ON public.income_entries(user_id);
CREATE INDEX idx_income_entries_date ON public.income_entries(user_id, date);

-- 6. Budgets
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

-- 7. Monthly budget plans
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

-- 8. Brokerage accounts
CREATE TABLE public.brokerage_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    broker_kind TEXT NOT NULL
        CHECK (char_length(btrim(broker_kind)) > 0 AND char_length(btrim(broker_kind)) <= 80),
    name TEXT NOT NULL,
    account_currency TEXT NOT NULL DEFAULT 'USD',
    fee_mode TEXT NOT NULL DEFAULT 'manual' CHECK (fee_mode IN ('manual', 'percent', 'fixed', 'percent_plus_fixed')),
    fee_percent DECIMAL(10, 6) NOT NULL DEFAULT 0 CHECK (fee_percent >= 0),
    fee_fixed_amount DECIMAL(12, 4) NOT NULL DEFAULT 0 CHECK (fee_fixed_amount >= 0),
    fee_min_amount DECIMAL(12, 4) NOT NULL DEFAULT 0 CHECK (fee_min_amount >= 0),
    fee_currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brokerage_accounts_user_id
    ON public.brokerage_accounts(user_id, created_at);

ALTER TABLE public.brokerage_accounts
    DROP CONSTRAINT IF EXISTS brokerage_accounts_broker_kind_check;

ALTER TABLE public.brokerage_accounts
    ADD CONSTRAINT brokerage_accounts_broker_kind_check
    CHECK (char_length(btrim(broker_kind)) > 0 AND char_length(btrim(broker_kind)) <= 80);

-- 9. Investment assets
CREATE TABLE public.investment_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_key TEXT NOT NULL,
    symbol TEXT NOT NULL,
    display_name TEXT,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'etf', 'crypto')),
    market_code TEXT NOT NULL CHECK (market_code IN ('US', 'CO', 'CRYPTO')),
    exchange_code TEXT,
    quote_currency TEXT NOT NULL DEFAULT 'USD',
    provider_symbol_twelve TEXT,
    provider_symbol_eodhd TEXT,
    is_price_supported BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, asset_key)
);

CREATE INDEX idx_investment_assets_user_lookup
    ON public.investment_assets(user_id, market_code, symbol);

-- 10. Investment trades
CREATE TABLE public.investment_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.brokerage_accounts(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.investment_assets(id) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    trade_date DATE NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL CHECK (quantity > 0),
    execution_price DECIMAL(18, 8) NOT NULL CHECK (execution_price > 0),
    execution_currency TEXT NOT NULL,
    reference_close_price DECIMAL(18, 8),
    reference_close_currency TEXT,
    reference_price_date DATE,
    reference_source TEXT,
    reference_status TEXT NOT NULL DEFAULT 'manual_only'
        CHECK (reference_status IN ('fetched', 'fallback_previous_trading_day', 'unavailable', 'manual_only')),
    fee_amount DECIMAL(18, 8) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
    fee_currency TEXT NOT NULL DEFAULT 'USD',
    notes TEXT,
    source_kind TEXT NOT NULL DEFAULT 'manual' CHECK (source_kind IN ('manual', 'ibkr_import', 'hapi_statement')),
    external_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_investment_trades_user_date
    ON public.investment_trades(user_id, trade_date DESC, created_at DESC);
CREATE INDEX idx_investment_trades_asset
    ON public.investment_trades(user_id, asset_id, trade_date DESC);
CREATE INDEX idx_investment_trades_account
    ON public.investment_trades(user_id, account_id, trade_date DESC);

-- 11. Investment cash movements
CREATE TABLE public.investment_cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.brokerage_accounts(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('deposit', 'withdrawal')),
    movement_date DATE NOT NULL,
    amount DECIMAL(18, 8) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL,
    fee_amount DECIMAL(18, 8) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
    fee_currency TEXT NOT NULL DEFAULT 'USD',
    notes TEXT,
    source_kind TEXT NOT NULL DEFAULT 'manual' CHECK (source_kind IN ('manual', 'ibkr_import', 'hapi_statement')),
    external_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_investment_cash_movements_user_date
    ON public.investment_cash_movements(user_id, movement_date DESC, created_at DESC);
CREATE INDEX idx_investment_cash_movements_account
    ON public.investment_cash_movements(user_id, account_id, movement_date DESC);

-- 12. Investment watchlist
CREATE TABLE public.investment_watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.investment_assets(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, asset_id)
);

CREATE INDEX idx_investment_watchlist_user_id
    ON public.investment_watchlist(user_id, created_at DESC);

-- 13. Market price history cache
CREATE TABLE public.market_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('twelve_data', 'eodhd')),
    provider_symbol TEXT NOT NULL,
    quote_date DATE NOT NULL,
    close DECIMAL(18, 8) NOT NULL CHECK (close >= 0),
    currency TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider, provider_symbol, quote_date)
);

CREATE INDEX idx_market_price_history_lookup
    ON public.market_price_history(provider, provider_symbol, quote_date DESC);

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

CREATE TRIGGER set_updated_at_recurring_expenses
    BEFORE UPDATE ON public.recurring_expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_income_entries
    BEFORE UPDATE ON public.income_entries
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

CREATE TRIGGER set_updated_at_brokerage_accounts
    BEFORE UPDATE ON public.brokerage_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_investment_assets
    BEFORE UPDATE ON public.investment_assets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_investment_trades
    BEFORE UPDATE ON public.investment_trades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_investment_cash_movements
    BEFORE UPDATE ON public.investment_cash_movements
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
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokerage_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_history ENABLE ROW LEVEL SECURITY;

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

-- Recurring expenses
CREATE POLICY "Users can view own recurring expenses"
    ON public.recurring_expenses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own recurring expenses"
    ON public.recurring_expenses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own recurring expenses"
    ON public.recurring_expenses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own recurring expenses"
    ON public.recurring_expenses FOR DELETE USING (user_id = auth.uid());

-- Income entries
CREATE POLICY "Users can view own income entries"
    ON public.income_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own income entries"
    ON public.income_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own income entries"
    ON public.income_entries FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own income entries"
    ON public.income_entries FOR DELETE USING (user_id = auth.uid());

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

-- Brokerage accounts
CREATE POLICY "Users can view own brokerage accounts"
    ON public.brokerage_accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own brokerage accounts"
    ON public.brokerage_accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own brokerage accounts"
    ON public.brokerage_accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own brokerage accounts"
    ON public.brokerage_accounts FOR DELETE USING (user_id = auth.uid());

-- Investment assets
CREATE POLICY "Users can view own investment assets"
    ON public.investment_assets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own investment assets"
    ON public.investment_assets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investment assets"
    ON public.investment_assets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own investment assets"
    ON public.investment_assets FOR DELETE USING (user_id = auth.uid());

-- Investment trades
CREATE POLICY "Users can view own investment trades"
    ON public.investment_trades FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own investment trades"
    ON public.investment_trades FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investment trades"
    ON public.investment_trades FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own investment trades"
    ON public.investment_trades FOR DELETE USING (user_id = auth.uid());

-- Investment cash movements
CREATE POLICY "Users can view own investment cash movements"
    ON public.investment_cash_movements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own investment cash movements"
    ON public.investment_cash_movements FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investment cash movements"
    ON public.investment_cash_movements FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own investment cash movements"
    ON public.investment_cash_movements FOR DELETE USING (user_id = auth.uid());

-- Investment watchlist
CREATE POLICY "Users can view own investment watchlist"
    ON public.investment_watchlist FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own investment watchlist"
    ON public.investment_watchlist FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investment watchlist"
    ON public.investment_watchlist FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own investment watchlist"
    ON public.investment_watchlist FOR DELETE USING (user_id = auth.uid());

-- Market price history
CREATE POLICY "Authenticated users can view market price history"
    ON public.market_price_history FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert market price history"
    ON public.market_price_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update market price history"
    ON public.market_price_history FOR UPDATE USING (auth.uid() IS NOT NULL);
