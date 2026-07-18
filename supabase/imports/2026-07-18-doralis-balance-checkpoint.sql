-- Doralis opening available-balance checkpoint, confirmed from the supplied
-- Banco de Occidente balance screenshot. No bank account number is stored.

BEGIN;

DO $$
DECLARE
  v_user_id UUID;
  v_currency TEXT;
  v_july_income NUMERIC(18, 2);
  v_july_expenses NUMERIC(18, 2);
  v_july_transfers NUMERIC(18, 2);
  v_monthly_net NUMERIC(18, 2);
BEGIN
  SELECT users.id, profiles.base_currency
  INTO v_user_id, v_currency
  FROM auth.users AS users
  JOIN public.profiles ON profiles.id = users.id
  WHERE lower(users.email) = lower('doralisderamirez@gmail.com')
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Doralis user not found';
  ELSIF v_currency <> 'COP' THEN
    RAISE EXCEPTION 'Expected Doralis base currency COP, found %', v_currency;
  END IF;

  SELECT COALESCE(sum(amount), 0)::NUMERIC(18, 2)
  INTO v_july_income
  FROM public.income_entries
  WHERE user_id = v_user_id
    AND date BETWEEN DATE '2026-07-01' AND DATE '2026-07-18';

  SELECT COALESCE(sum(amount), 0)::NUMERIC(18, 2)
  INTO v_july_expenses
  FROM public.expenses
  WHERE user_id = v_user_id
    AND date BETWEEN DATE '2026-07-01' AND DATE '2026-07-18';

  SELECT COALESCE(sum(amount), 0)::NUMERIC(18, 2)
  INTO v_july_transfers
  FROM public.investment_savings_transfers
  WHERE user_id = v_user_id
    AND transfer_date BETWEEN DATE '2026-07-01' AND DATE '2026-07-18';

  v_monthly_net := v_july_income - v_july_expenses - v_july_transfers;

  IF v_july_income <> 1752489.50
     OR v_july_expenses <> 4518123.88
     OR v_july_transfers <> 0.00
     OR v_monthly_net <> -2765634.38
  THEN
    RAISE EXCEPTION
      'Doralis July basis changed (income %, expenses %, transfers %, net %)',
      v_july_income, v_july_expenses, v_july_transfers, v_monthly_net;
  END IF;

  INSERT INTO public.balance_checkpoints (
    id,
    user_id,
    balance,
    currency,
    as_of_date,
    calculated_balance_before,
    reconciliation_delta,
    calculation_start_date,
    calculation_basis,
    note
  ) VALUES (
    'b4ca08f9-9f55-43ce-92ab-3c83fd4d8d8e',
    v_user_id,
    7025963.50,
    'COP',
    DATE '2026-07-18',
    v_monthly_net,
    9791597.88,
    DATE '2026-07-01',
    'monthly_net',
    'User-confirmed Banco de Occidente available balance; no account identifier stored.'
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.balance_checkpoints
    WHERE id = 'b4ca08f9-9f55-43ce-92ab-3c83fd4d8d8e'
      AND balance = 7025963.50
      AND currency = 'COP'
      AND as_of_date = DATE '2026-07-18'
      AND calculated_balance_before = -2765634.38
      AND reconciliation_delta = 9791597.88
      AND calculation_start_date = DATE '2026-07-01'
      AND calculation_basis = 'monthly_net'
  ) THEN
    RAISE EXCEPTION 'Doralis opening balance checkpoint failed verification';
  END IF;
END $$;

COMMIT;
