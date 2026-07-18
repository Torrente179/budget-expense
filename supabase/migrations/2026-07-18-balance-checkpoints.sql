-- User-level available-balance checkpoints (app project).
-- This is intentionally not a bank-account model: no account number or bank
-- identifier is stored. Checkpoints are immutable reconciliation events.

CREATE TABLE IF NOT EXISTS public.balance_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance NUMERIC(18, 2) NOT NULL,
    currency TEXT NOT NULL CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$'),
    as_of_date DATE NOT NULL,
    calculated_balance_before NUMERIC(18, 2),
    reconciliation_delta NUMERIC(18, 2),
    calculation_start_date DATE,
    calculation_basis TEXT CHECK (
        calculation_basis IS NULL OR
        calculation_basis IN ('monthly_net', 'tracked_balance')
    ),
    note TEXT CHECK (note IS NULL OR char_length(note) <= 240),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT balance_checkpoint_reconciliation_consistent CHECK (
        (
            calculated_balance_before IS NULL AND
            reconciliation_delta IS NULL AND
            calculation_start_date IS NULL AND
            calculation_basis IS NULL
        ) OR (
            calculated_balance_before IS NOT NULL AND
            reconciliation_delta = balance - calculated_balance_before AND
            calculation_start_date IS NOT NULL AND
            calculation_basis IS NOT NULL
        )
    )
);

COMMENT ON TABLE public.balance_checkpoints IS
    'Append-only user balance confirmations; not income and not a bank-account registry';
COMMENT ON COLUMN public.balance_checkpoints.as_of_date IS
    'Calendar date represented by the confirmed balance';
COMMENT ON COLUMN public.balance_checkpoints.reconciliation_delta IS
    'Audit-only difference versus calculated_balance_before; never ledger income';

CREATE INDEX IF NOT EXISTS idx_balance_checkpoints_latest
    ON public.balance_checkpoints(user_id, as_of_date DESC, created_at DESC);

ALTER TABLE public.balance_checkpoints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own balance checkpoints"
        ON public.balance_checkpoints FOR SELECT
        USING (auth.uid() = user_id);
    CREATE POLICY "Users can append own balance checkpoints"
        ON public.balance_checkpoints FOR INSERT
        WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- created_at participates in same-day ordering, so authenticated inserts may
-- not choose it (or another user's id). Service-role SQL remains seedable.
CREATE OR REPLACE FUNCTION public.enforce_balance_checkpoint_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        NEW.user_id := auth.uid();
        NEW.created_at := now();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_balance_checkpoint_insert
    ON public.balance_checkpoints;
CREATE TRIGGER enforce_balance_checkpoint_insert
    BEFORE INSERT ON public.balance_checkpoints
    FOR EACH ROW EXECUTE FUNCTION public.enforce_balance_checkpoint_insert();
