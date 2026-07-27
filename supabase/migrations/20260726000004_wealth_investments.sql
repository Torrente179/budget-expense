-- ============================================
-- Manually valued investments
--
-- The existing investment model is trade-based: brokerage_accounts →
-- investment_assets → investment_trades, with market value derived from FIFO
-- lots and live quotes. That is right for tracked positions, but it cannot
-- express "my pension pot is worth 10.000 € and I put in 9.550 €" — there is
-- no quantity, no ticker, and no price feed.
--
-- This table holds the second kind: a holding the user values by hand.
-- `current_value` is whatever they last said it was worth; `contributed_cost`
-- is what went in. Unrealized gain is the difference, and it is NOT income.
--
-- Net worth sums both models. They never overlap: a trade-tracked position
-- lives in investment_trades and is absent here.
-- ============================================

CREATE TABLE IF NOT EXISTS public.wealth_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'fund'
        CHECK (kind IN ('brokerage', 'fund', 'stocks', 'crypto', 'pension', 'other')),
    name TEXT NOT NULL
        CHECK (char_length(btrim(name)) > 0 AND char_length(name) <= 120),
    institution TEXT
        CHECK (institution IS NULL OR char_length(institution) <= 120),
    currency TEXT NOT NULL DEFAULT 'EUR'
        CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
    current_value DECIMAL(16, 2) NOT NULL DEFAULT 0 CHECK (current_value >= 0),
    contributed_cost DECIMAL(16, 2) NOT NULL DEFAULT 0 CHECK (contributed_cost >= 0),
    /** Optional ticker/ISIN for the user's own reference; not a price key. */
    reference TEXT CHECK (reference IS NULL OR char_length(reference) <= 64),
    notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 500),
    valued_on DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'closed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wealth_investments_user
    ON public.wealth_investments(user_id, status);

ALTER TABLE public.wealth_investments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own wealth investments"
        ON public.wealth_investments FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own wealth investments"
        ON public.wealth_investments FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own wealth investments"
        ON public.wealth_investments FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own wealth investments"
        ON public.wealth_investments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS update_wealth_investments_updated_at
    ON public.wealth_investments;
CREATE TRIGGER update_wealth_investments_updated_at
    BEFORE UPDATE ON public.wealth_investments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.wealth_investments IS
    'Manually valued holdings (pensions, funds, crypto) that have no trade history. Trade-tracked positions live in investment_trades and are never duplicated here.';
