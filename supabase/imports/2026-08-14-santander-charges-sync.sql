-- Idempotent Santander charges sync for pablopablo179@gmail.com
-- Source: /Users/juanpabloramirez/Downloads/export_excel 6.xlsx
-- Window: 2026-08-11 to 2026-08-14
-- Expense inserts staged: 19; income inserts staged: 1
-- Skipped matched expenses: 1; skipped matched incomes: 0

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
  ('38d00d10-9a77-4fbf-918d-560cdb3995a2', 82.85, 'EUR', 'Bizum to RAFAEL EDUARDO DELGADO ROCCA - Gastos Ligonde', '2026-08-14'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 1.00, 'EUR', 'PLK 16082 ALAME', '2026-08-13'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 5.00, 'EUR', 'CAFETERIA FRAMI', '2026-08-13'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 5.00, 'EUR', 'CAFETERIA FRAMIL S.L', '2026-08-13'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 5.29, 'EUR', 'Too Good To Go', '2026-08-13'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 5.15, 'EUR', 'BUENO CAFE', '2026-08-13'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 5.70, 'EUR', 'CAFE BAR FRAMIL', '2026-08-13'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 2.31, 'EUR', 'WORKCAFE MALAGA', '2026-08-13'),
  ('1f1d0883-4c9a-4aa5-b2c1-a497017d3b79', 55.67, 'EUR', 'TELEFONICA MOVILES SA', '2026-08-13'),
  ('1b9a514c-0d6a-4d46-b8a3-16d1568b05a9', 300.00, 'EUR', 'Transfer to Hafsa Laghzaoui - Arriendo', '2026-08-12'),
  ('58ebeb9b-0dd3-4751-bf85-6c2e422c36d7', 17.89, 'EUR', 'OPENAI *CHATGPT SUBSCR', '2026-08-12'),
  ('58ebeb9b-0dd3-4751-bf85-6c2e422c36d7', 9.39, 'EUR', 'ANTHROPIC', '2026-08-12'),
  ('58ebeb9b-0dd3-4751-bf85-6c2e422c36d7', 4.99, 'EUR', 'Amazon Prime*pm8rb3ji5', '2026-08-12'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 7.90, 'EUR', 'RESTAURANTE LA', '2026-08-12'),
  ('e79028c7-278a-4139-8f8e-a5944e716f5d', 2.75, 'EUR', 'DIA 7739', '2026-08-11'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 4.75, 'EUR', 'KING TORRES RINCON', '2026-08-11'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 5.15, 'EUR', 'BUENO CAFE', '2026-08-11'),
  ('6f2bd36d-9ac8-4cdb-85d9-c8e5036d7357', 6.50, 'EUR', 'POLLOS SAN JUAN', '2026-08-11'),
  ('4e9ac3f4-c625-4750-9140-d6eae49b2ca0', 10.00, 'EUR', 'ATM cash withdrawal', '2026-08-11');

CREATE TEMP TABLE tmp_income_import (
  source TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL
);

INSERT INTO tmp_income_import (source, amount, currency, description, date)
VALUES
  ('Transfer from Bridge Building S.A. - Payout - Enviado desde ARQ', 68.00, 'EUR', 'TRANSFERENCIA INMEDIATA DE Bridge Building S.A., CONCEPTO Payout - Enviado desde ARQ', '2026-08-14');

WITH ctx AS (SELECT user_id FROM tmp_import_context LIMIT 1)
INSERT INTO public.expenses (user_id, category_id, amount, currency, description, date, source_kind)
SELECT ctx.user_id, staged.category_id, staged.amount, staged.currency, staged.description, staged.date, 'import_script'
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
INSERT INTO public.income_entries (user_id, source, amount, currency, description, date, source_kind)
SELECT ctx.user_id, staged.source, staged.amount, staged.currency, staged.description, staged.date, 'import_script'
FROM tmp_income_import staged
CROSS JOIN ctx
WHERE NOT EXISTS (
  SELECT 1 FROM public.income_entries existing
  WHERE existing.user_id = ctx.user_id
    AND existing.amount = staged.amount
    AND existing.currency = staged.currency
    AND existing.date = staged.date
    AND lower(COALESCE(existing.source, '')) = lower(staged.source)
);

SELECT 'staged_expenses' AS metric, COUNT(*)::text AS value FROM tmp_expense_import
UNION ALL SELECT 'staged_incomes', COUNT(*)::text FROM tmp_income_import
UNION ALL SELECT 'resolved_user_id', user_id::text FROM tmp_import_context;

COMMIT;
