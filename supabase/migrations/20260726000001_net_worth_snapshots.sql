-- ============================================
-- Net worth snapshots (Evolución)
-- Nothing in the app stored balances over time: `prepare_month_snapshot` is
-- an RPC that persists no balance, and `balance_checkpoints` covers liquid
-- cash only. Without history there is no "change this month" and no chart.
--
-- One row per user per day. The UNIQUE constraint IS the once-a-day rule —
-- writes upsert with ON CONFLICT (user_id, as_of_date) DO UPDATE, so a
-- repeated write is idempotent instead of a second row.
--
-- Totals are stored already converted to the user's base currency, because
-- FX conversion only exists client-side (CurrencyProvider.convert). The
-- currency is recorded so a later base-currency change is detectable rather
-- than silently mixing units.
-- ============================================

CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    as_of_date DATE NOT NULL,
    base_currency TEXT NOT NULL
        CHECK (base_currency = upper(base_currency) AND base_currency ~ '^[A-Z]{3}$'),
    total_assets DECIMAL(16, 2) NOT NULL,
    total_liabilities DECIMAL(16, 2) NOT NULL,
    net_worth DECIMAL(16, 2) NOT NULL,
    -- { accountsAndCash, savings, investments, moneyLent, debts }
    breakdown JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT net_worth_snapshots_unique_day UNIQUE (user_id, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_user_date
    ON public.net_worth_snapshots(user_id, as_of_date DESC);

ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own net worth snapshots"
        ON public.net_worth_snapshots FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own net worth snapshots"
        ON public.net_worth_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own net worth snapshots"
        ON public.net_worth_snapshots FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own net worth snapshots"
        ON public.net_worth_snapshots FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE public.net_worth_snapshots IS
    'Daily net-worth history in the user base currency. One row per user per day; month-end is whichever day the user last opened the app that month.';
