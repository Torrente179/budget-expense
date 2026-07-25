-- ============================================
-- updated_at triggers for the wealth tables
--
-- 20260726000000 and ...0001 declared `updated_at` columns but no trigger, so
-- the column would have kept its insert-time value forever. Every other table
-- in this schema maintains it with public.update_updated_at() (defined in
-- supabase/migration.sql:337); these three were the exception by mistake.
-- ============================================

DROP TRIGGER IF EXISTS update_wealth_accounts_updated_at
    ON public.wealth_accounts;
CREATE TRIGGER update_wealth_accounts_updated_at
    BEFORE UPDATE ON public.wealth_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- Force user_id from the session and inherit currency from the parent
-- account, mirroring the balance_checkpoints insert trigger. One account has
-- one currency, so a movement can never introduce an FX event of its own.
-- ============================================

CREATE OR REPLACE FUNCTION public.enforce_wealth_account_movement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_currency TEXT;
BEGIN
    IF auth.uid() IS NOT NULL THEN
        NEW.user_id := auth.uid();
    END IF;

    SELECT currency INTO v_currency
    FROM public.wealth_accounts
    WHERE id = NEW.account_id AND user_id = NEW.user_id;

    IF v_currency IS NULL THEN
        RAISE EXCEPTION 'Account % does not belong to this user', NEW.account_id
            USING ERRCODE = '42501';
    END IF;

    NEW.currency := v_currency;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_wealth_account_movement
    ON public.wealth_account_movements;
CREATE TRIGGER enforce_wealth_account_movement
    BEFORE INSERT OR UPDATE ON public.wealth_account_movements
    FOR EACH ROW EXECUTE FUNCTION public.enforce_wealth_account_movement();
