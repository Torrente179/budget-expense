-- Idempotent Santander last-30-days sync for pablopablo179@gmail.com
-- Source: /Users/juanpabloramirez/Downloads/export_excel 5.xlsx
-- Window: 2026-06-20 to 2026-07-20
-- Expense inserts staged: 7; income inserts staged: 1
-- Skipped matched expenses: 122; skipped matched incomes: 9

BEGIN;

CREATE TEMP TABLE tmp_import_context (user_id UUID NOT NULL);
INSERT INTO tmp_import_context (user_id)
SELECT id FROM auth.users WHERE lower(email) = lower('pablopablo179@gmail.com') LIMIT 1;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM tmp_import_context) THEN
    RAISE EXCEPTION 'User pablopablo179@gmail.com not found';
  END IF;
END $$;

CREATE TEMP TABLE tmp_expense_import (
  category_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL
);

INSERT INTO tmp_expense_import (category_id, amount, currency, description, date)
VALUES
  ('58ebeb9b-0dd3-4751-bf85-6c2e422c36d7', 2.99, 'EUR', 'APPLE.COM/BILL', '2026-07-20'),
  ('e673aa64-777b-42af-9860-dfda14c9758a', 64.01, 'EUR', 'OMIO', '2026-07-20'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 4.90, 'EUR', 'NO PIQUI', '2026-07-20'),
  ('cfe76f4c-6b36-4e77-9e5e-9f8599fd2eab', 17.30, 'EUR', 'WWW.AMAZON*QV82U1SL5', '2026-07-20'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 2.50, 'EUR', 'CHIRINGUITO EL', '2026-07-20'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 5.50, 'EUR', 'HAMBURGUESERIA', '2026-07-19'),
  ('e79028c7-278a-4139-8f8e-a5944e716f5d', 10.84, 'EUR', 'MERCADONA COTOM', '2026-07-17');

CREATE TEMP TABLE tmp_income_import (
  source TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL
);

INSERT INTO tmp_income_import (source, amount, currency, description, date)
VALUES
  ('Monika', 22.50, 'EUR', 'TRANSFERENCIA INMEDIATA DE MONIKA DOEMEOVA, CONCEPTO Movistart July', '2026-06-22');

WITH ctx AS (SELECT user_id FROM tmp_import_context LIMIT 1)
INSERT INTO public.expenses (user_id, category_id, amount, currency, description, date)
SELECT ctx.user_id, staged.category_id, staged.amount, staged.currency, staged.description, staged.date
FROM tmp_expense_import staged
CROSS JOIN ctx
WHERE NOT EXISTS (
  SELECT 1 FROM public.expenses existing
  WHERE existing.user_id = ctx.user_id
    AND existing.amount = staged.amount
    AND existing.currency = staged.currency
    AND existing.date = staged.date
    AND lower(COALESCE(existing.description, '')) = lower(staged.description)
);

WITH ctx AS (SELECT user_id FROM tmp_import_context LIMIT 1)
INSERT INTO public.income_entries (user_id, source, amount, currency, description, date)
SELECT ctx.user_id, staged.source, staged.amount, staged.currency, staged.description, staged.date
FROM tmp_income_import staged
CROSS JOIN ctx
WHERE NOT EXISTS (
  SELECT 1 FROM public.income_entries existing
  WHERE existing.user_id = ctx.user_id
    AND existing.amount = staged.amount
    AND existing.currency = staged.currency
    AND existing.date BETWEEN staged.date - 3 AND staged.date + 3
);

SELECT 'staged_expenses' AS metric, COUNT(*)::text AS value FROM tmp_expense_import
UNION ALL SELECT 'staged_incomes', COUNT(*)::text FROM tmp_income_import
UNION ALL SELECT 'resolved_user_id', user_id::text FROM tmp_import_context;

COMMIT;
