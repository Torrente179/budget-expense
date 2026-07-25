-- ============================================
-- Allow savings withdrawals
--
-- `investment_savings_transfers.amount` was CHECK (amount > 0) and the only
-- account field in the form is labelled "Cuenta destino", so savings balances
-- could only ever ratchet up — there was no withdrawal path in the schema,
-- the API, or the UI. A balance sheet cannot work that way: money taken out
-- of a savings fund has to reduce it.
--
-- Negative = withdrawal, mirroring liability_payments.amount, which already
-- allows negatives as upward balance adjustments. Balances are summed, so
-- signed amounts need no other change to the aggregation.
-- ============================================

-- The original constraint was declared inline, so its name is whatever
-- Postgres generated. Dropping a guessed name with IF EXISTS would silently
-- no-op and leave `amount > 0` enforced, so find every CHECK on the table
-- that mentions `amount` and drop it by its real name.
DO $$
DECLARE
    v_name TEXT;
BEGIN
    FOR v_name IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'investment_savings_transfers'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%amount%'
    LOOP
        EXECUTE format(
            'ALTER TABLE public.investment_savings_transfers DROP CONSTRAINT %I',
            v_name
        );
    END LOOP;
END $$;

ALTER TABLE public.investment_savings_transfers
    ADD CONSTRAINT investment_savings_transfers_amount_check CHECK (amount <> 0);

COMMENT ON COLUMN public.investment_savings_transfers.amount IS
    'Signed: positive is a deposit into the fund, negative is a withdrawal out of it.';
