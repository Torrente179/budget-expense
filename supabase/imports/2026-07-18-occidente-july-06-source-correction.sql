-- Restore the source-exact July 6 electronic-service payment visible in the
-- supplied Banco de Occidente screenshot: COP 777,254.00 (not 277,254.00).

BEGIN;

DO $$
DECLARE
  v_user_id UUID;
  v_row_id UUID := 'b604c24c-d7db-48af-be14-567fd3637795';
  v_current_amount NUMERIC(18, 2);
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower('doralisderamirez@gmail.com')
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Doralis user not found';
  END IF;

  SELECT amount INTO v_current_amount
  FROM public.expenses
  WHERE id = v_row_id
    AND user_id = v_user_id
    AND date = DATE '2026-07-06'
    AND description = 'RECAUDO/PAGO SERVICIOS ELECT';

  IF v_current_amount IS NULL THEN
    RAISE EXCEPTION 'Expected July 6 source row not found';
  ELSIF v_current_amount = 777254.00 THEN
    RETURN;
  ELSIF v_current_amount <> 277254.00 THEN
    RAISE EXCEPTION 'Refusing correction: unexpected current amount %', v_current_amount;
  END IF;

  UPDATE public.expenses
  SET amount = 777254.00,
      updated_at = now()
  WHERE id = v_row_id;
END $$;

DO $$
DECLARE
  v_user_id UUID;
  v_july_expenses NUMERIC(18, 2);
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower('doralisderamirez@gmail.com')
  LIMIT 1;

  SELECT COALESCE(sum(amount), 0)::NUMERIC(18, 2)
  INTO v_july_expenses
  FROM public.expenses
  WHERE user_id = v_user_id
    AND date BETWEEN DATE '2026-07-01' AND DATE '2026-07-18';

  IF v_july_expenses <> 4518123.88 THEN
    RAISE EXCEPTION 'July expenses do not reconcile after source correction: %', v_july_expenses;
  END IF;
END $$;

COMMIT;
