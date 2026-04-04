-- Feature-table catch-up migration for existing Supabase projects.
-- Safe to run on databases that already contain some or all of these objects.

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.recurring_expenses (
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

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_active
    ON public.recurring_expenses(user_id, is_active, charge_day);

ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS recurring_expense_id UUID,
    ADD COLUMN IF NOT EXISTS recurring_month DATE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'expenses_recurring_expense_id_fkey'
    ) THEN
        ALTER TABLE public.expenses
            ADD CONSTRAINT expenses_recurring_expense_id_fkey
            FOREIGN KEY (recurring_expense_id)
            REFERENCES public.recurring_expenses(id)
            ON DELETE SET NULL;
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_recurring_month_unique
    ON public.expenses(user_id, recurring_expense_id, recurring_month);

CREATE TABLE IF NOT EXISTS public.income_entries (
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

CREATE INDEX IF NOT EXISTS idx_income_entries_user_id
    ON public.income_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_income_entries_date
    ON public.income_entries(user_id, date);

CREATE TABLE IF NOT EXISTS public.monthly_budget_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    income_amount DECIMAL(12, 2) NOT NULL CHECK (income_amount > 0),
    income_currency TEXT NOT NULL DEFAULT 'EUR',
    allocation_percent DECIMAL(5, 2) NOT NULL DEFAULT 20
        CHECK (allocation_percent > 0 AND allocation_percent <= 100),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_budget_plans_user_period
    ON public.monthly_budget_plans(user_id, year, month);

CREATE TABLE IF NOT EXISTS public.brokerage_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    broker_kind TEXT NOT NULL
        CHECK (char_length(btrim(broker_kind)) > 0 AND char_length(btrim(broker_kind)) <= 80),
    name TEXT NOT NULL,
    account_currency TEXT NOT NULL DEFAULT 'USD',
    fee_mode TEXT NOT NULL DEFAULT 'manual'
        CHECK (fee_mode IN ('manual', 'percent', 'fixed', 'percent_plus_fixed')),
    fee_percent DECIMAL(10, 6) NOT NULL DEFAULT 0 CHECK (fee_percent >= 0),
    fee_fixed_amount DECIMAL(12, 4) NOT NULL DEFAULT 0 CHECK (fee_fixed_amount >= 0),
    fee_min_amount DECIMAL(12, 4) NOT NULL DEFAULT 0 CHECK (fee_min_amount >= 0),
    fee_currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brokerage_accounts_user_id
    ON public.brokerage_accounts(user_id, created_at);

ALTER TABLE IF EXISTS public.brokerage_accounts
    DROP CONSTRAINT IF EXISTS brokerage_accounts_broker_kind_check;

ALTER TABLE IF EXISTS public.brokerage_accounts
    ADD CONSTRAINT brokerage_accounts_broker_kind_check
    CHECK (char_length(btrim(broker_kind)) > 0 AND char_length(btrim(broker_kind)) <= 80);

CREATE TABLE IF NOT EXISTS public.investment_assets (
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

CREATE INDEX IF NOT EXISTS idx_investment_assets_user_lookup
    ON public.investment_assets(user_id, market_code, symbol);

CREATE TABLE IF NOT EXISTS public.investment_trades (
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
        CHECK (
            reference_status IN (
                'fetched',
                'fallback_previous_trading_day',
                'unavailable',
                'manual_only'
            )
        ),
    fee_amount DECIMAL(18, 8) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
    fee_currency TEXT NOT NULL DEFAULT 'USD',
    notes TEXT,
    source_kind TEXT NOT NULL DEFAULT 'manual'
        CHECK (source_kind IN ('manual', 'ibkr_import', 'hapi_statement')),
    external_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_trades_user_date
    ON public.investment_trades(user_id, trade_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investment_trades_asset
    ON public.investment_trades(user_id, asset_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_investment_trades_account
    ON public.investment_trades(user_id, account_id, trade_date DESC);

CREATE TABLE IF NOT EXISTS public.investment_cash_movements (
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
    source_kind TEXT NOT NULL DEFAULT 'manual'
        CHECK (source_kind IN ('manual', 'ibkr_import', 'hapi_statement')),
    external_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_cash_movements_user_date
    ON public.investment_cash_movements(user_id, movement_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investment_cash_movements_account
    ON public.investment_cash_movements(user_id, account_id, movement_date DESC);

CREATE TABLE IF NOT EXISTS public.investment_watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.investment_assets(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_investment_watchlist_user_id
    ON public.investment_watchlist(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.market_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('twelve_data', 'eodhd')),
    provider_symbol TEXT NOT NULL,
    quote_date DATE NOT NULL,
    close DECIMAL(18, 8) NOT NULL CHECK (close >= 0),
    currency TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider, provider_symbol, quote_date)
);

CREATE INDEX IF NOT EXISTS idx_market_price_history_lookup
    ON public.market_price_history(provider, provider_symbol, quote_date DESC);

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

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokerage_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_savings_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recurring expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can insert own recurring expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can update own recurring expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can delete own recurring expenses" ON public.recurring_expenses;

CREATE POLICY "Users can view own recurring expenses"
    ON public.recurring_expenses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own recurring expenses"
    ON public.recurring_expenses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own recurring expenses"
    ON public.recurring_expenses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own recurring expenses"
    ON public.recurring_expenses FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own income entries" ON public.income_entries;
DROP POLICY IF EXISTS "Users can insert own income entries" ON public.income_entries;
DROP POLICY IF EXISTS "Users can update own income entries" ON public.income_entries;
DROP POLICY IF EXISTS "Users can delete own income entries" ON public.income_entries;

CREATE POLICY "Users can view own income entries"
    ON public.income_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own income entries"
    ON public.income_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own income entries"
    ON public.income_entries FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own income entries"
    ON public.income_entries FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own monthly budget plans" ON public.monthly_budget_plans;
DROP POLICY IF EXISTS "Users can insert own monthly budget plans" ON public.monthly_budget_plans;
DROP POLICY IF EXISTS "Users can update own monthly budget plans" ON public.monthly_budget_plans;
DROP POLICY IF EXISTS "Users can delete own monthly budget plans" ON public.monthly_budget_plans;

CREATE POLICY "Users can view own monthly budget plans"
    ON public.monthly_budget_plans FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own monthly budget plans"
    ON public.monthly_budget_plans FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own monthly budget plans"
    ON public.monthly_budget_plans FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own monthly budget plans"
    ON public.monthly_budget_plans FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own brokerage accounts" ON public.brokerage_accounts;
DROP POLICY IF EXISTS "Users can insert own brokerage accounts" ON public.brokerage_accounts;
DROP POLICY IF EXISTS "Users can update own brokerage accounts" ON public.brokerage_accounts;
DROP POLICY IF EXISTS "Users can delete own brokerage accounts" ON public.brokerage_accounts;

CREATE POLICY "Users can view own brokerage accounts"
    ON public.brokerage_accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own brokerage accounts"
    ON public.brokerage_accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own brokerage accounts"
    ON public.brokerage_accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own brokerage accounts"
    ON public.brokerage_accounts FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own investment assets" ON public.investment_assets;
DROP POLICY IF EXISTS "Users can insert own investment assets" ON public.investment_assets;
DROP POLICY IF EXISTS "Users can update own investment assets" ON public.investment_assets;
DROP POLICY IF EXISTS "Users can delete own investment assets" ON public.investment_assets;

CREATE POLICY "Users can view own investment assets"
    ON public.investment_assets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own investment assets"
    ON public.investment_assets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investment assets"
    ON public.investment_assets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own investment assets"
    ON public.investment_assets FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own investment trades" ON public.investment_trades;
DROP POLICY IF EXISTS "Users can insert own investment trades" ON public.investment_trades;
DROP POLICY IF EXISTS "Users can update own investment trades" ON public.investment_trades;
DROP POLICY IF EXISTS "Users can delete own investment trades" ON public.investment_trades;

CREATE POLICY "Users can view own investment trades"
    ON public.investment_trades FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own investment trades"
    ON public.investment_trades FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investment trades"
    ON public.investment_trades FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own investment trades"
    ON public.investment_trades FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own investment cash movements" ON public.investment_cash_movements;
DROP POLICY IF EXISTS "Users can insert own investment cash movements" ON public.investment_cash_movements;
DROP POLICY IF EXISTS "Users can update own investment cash movements" ON public.investment_cash_movements;
DROP POLICY IF EXISTS "Users can delete own investment cash movements" ON public.investment_cash_movements;

CREATE POLICY "Users can view own investment cash movements"
    ON public.investment_cash_movements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own investment cash movements"
    ON public.investment_cash_movements FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investment cash movements"
    ON public.investment_cash_movements FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own investment cash movements"
    ON public.investment_cash_movements FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own investment watchlist" ON public.investment_watchlist;
DROP POLICY IF EXISTS "Users can insert own investment watchlist" ON public.investment_watchlist;
DROP POLICY IF EXISTS "Users can update own investment watchlist" ON public.investment_watchlist;
DROP POLICY IF EXISTS "Users can delete own investment watchlist" ON public.investment_watchlist;

CREATE POLICY "Users can view own investment watchlist"
    ON public.investment_watchlist FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own investment watchlist"
    ON public.investment_watchlist FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investment watchlist"
    ON public.investment_watchlist FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own investment watchlist"
    ON public.investment_watchlist FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can view market price history" ON public.market_price_history;
DROP POLICY IF EXISTS "Authenticated users can insert market price history" ON public.market_price_history;
DROP POLICY IF EXISTS "Authenticated users can update market price history" ON public.market_price_history;

CREATE POLICY "Authenticated users can view market price history"
    ON public.market_price_history FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert market price history"
    ON public.market_price_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update market price history"
    ON public.market_price_history FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view own investment savings accounts" ON public.investment_savings_accounts;
DROP POLICY IF EXISTS "Users can insert own investment savings accounts" ON public.investment_savings_accounts;
DROP POLICY IF EXISTS "Users can update own investment savings accounts" ON public.investment_savings_accounts;
DROP POLICY IF EXISTS "Users can delete own investment savings accounts" ON public.investment_savings_accounts;

CREATE POLICY "Users can view own investment savings accounts"
    ON public.investment_savings_accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own investment savings accounts"
    ON public.investment_savings_accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investment savings accounts"
    ON public.investment_savings_accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own investment savings accounts"
    ON public.investment_savings_accounts FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own investment savings transfers" ON public.investment_savings_transfers;
DROP POLICY IF EXISTS "Users can insert own investment savings transfers" ON public.investment_savings_transfers;
DROP POLICY IF EXISTS "Users can update own investment savings transfers" ON public.investment_savings_transfers;
DROP POLICY IF EXISTS "Users can delete own investment savings transfers" ON public.investment_savings_transfers;

CREATE POLICY "Users can view own investment savings transfers"
    ON public.investment_savings_transfers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own investment savings transfers"
    ON public.investment_savings_transfers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own investment savings transfers"
    ON public.investment_savings_transfers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own investment savings transfers"
    ON public.investment_savings_transfers FOR DELETE USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS set_updated_at_recurring_expenses ON public.recurring_expenses;
CREATE TRIGGER set_updated_at_recurring_expenses
    BEFORE UPDATE ON public.recurring_expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_income_entries ON public.income_entries;
CREATE TRIGGER set_updated_at_income_entries
    BEFORE UPDATE ON public.income_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_monthly_budget_plans ON public.monthly_budget_plans;
CREATE TRIGGER set_updated_at_monthly_budget_plans
    BEFORE UPDATE ON public.monthly_budget_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_brokerage_accounts ON public.brokerage_accounts;
CREATE TRIGGER set_updated_at_brokerage_accounts
    BEFORE UPDATE ON public.brokerage_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_investment_assets ON public.investment_assets;
CREATE TRIGGER set_updated_at_investment_assets
    BEFORE UPDATE ON public.investment_assets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_investment_trades ON public.investment_trades;
CREATE TRIGGER set_updated_at_investment_trades
    BEFORE UPDATE ON public.investment_trades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_investment_cash_movements ON public.investment_cash_movements;
CREATE TRIGGER set_updated_at_investment_cash_movements
    BEFORE UPDATE ON public.investment_cash_movements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_investment_savings_accounts ON public.investment_savings_accounts;
CREATE TRIGGER set_updated_at_investment_savings_accounts
    BEFORE UPDATE ON public.investment_savings_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_investment_savings_transfers ON public.investment_savings_transfers;
CREATE TRIGGER set_updated_at_investment_savings_transfers
    BEFORE UPDATE ON public.investment_savings_transfers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
