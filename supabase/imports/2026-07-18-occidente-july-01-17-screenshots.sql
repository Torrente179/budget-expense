-- Banco de Occidente screenshots, July 2-17, 2026.
-- Source order: screenshot 1, screenshot 2, screenshot 3.
-- Reconciled visible rows: 51 (34 expenses, 17 incomes).
-- Target account: doralisderamirez@gmail.com

BEGIN;

CREATE TEMP TABLE tmp_occidente_july_context (user_id UUID NOT NULL);

DO $$
DECLARE
  v_email TEXT := 'doralisderamirez@gmail.com';
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'No Auth user found for July Banco de Occidente import: ' || v_email;
  END IF;
  INSERT INTO tmp_occidente_july_context (user_id) VALUES (v_uid);
END $$;

CREATE TEMP TABLE tmp_occidente_july_import (
  screenshot INTEGER NOT NULL,
  screenshot_row INTEGER NOT NULL,
  row_type TEXT NOT NULL CHECK (row_type IN ('expense', 'income')),
  category_name TEXT,
  income_source TEXT,
  amount DECIMAL(14, 2) NOT NULL,
  currency TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  PRIMARY KEY (screenshot, screenshot_row)
);

INSERT INTO tmp_occidente_july_import VALUES
  (1, 1, 'expense', 'Other', NULL, 200000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-07-03'),
  (1, 2, 'income', NULL, 'Bank interest', 2.27, 'COP', 'INTERESES LIQUIDADOS', '2026-07-03'),
  (1, 3, 'expense', 'Taxes', NULL, 1755.60, 'COP', 'GMF', '2026-07-03'),
  (1, 4, 'expense', 'Other', NULL, 32700.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-07-02'),
  (1, 5, 'expense', 'Other', NULL, 30200.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-07-02'),
  (1, 6, 'expense', 'Transportation', NULL, 25000.00, 'COP', 'EDS TERPEL AUTOPISTA LIN', '2026-07-02'),
  (1, 7, 'expense', 'Transportation', NULL, 67638.00, 'COP', 'EDS TERPEL AUTOPISTA LIN', '2026-07-02'),
  (1, 8, 'expense', 'Groceries', NULL, 57590.00, 'COP', 'TIENDAS ARA', '2026-07-02'),
  (1, 9, 'expense', 'Groceries', NULL, 21500.00, 'COP', 'TIENDA D1 EL CEDRO', '2026-07-02'),
  (1, 10, 'income', NULL, 'Bank interest', 2.34, 'COP', 'INTERESES LIQUIDADOS', '2026-07-02'),
  (1, 11, 'expense', 'Taxes', NULL, 938.51, 'COP', 'GMF', '2026-07-02'),
  (2, 1, 'income', NULL, 'Bank interest', 1.52, 'COP', 'INTERESES LIQUIDADOS', '2026-07-09'),
  (2, 2, 'income', NULL, 'Bank interest', 1.52, 'COP', 'INTERESES LIQUIDADOS', '2026-07-08'),
  (2, 3, 'expense', 'Other', NULL, 12000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-07-07'),
  (2, 4, 'expense', 'Taxes', NULL, 48.00, 'COP', 'GMF', '2026-07-07'),
  (2, 5, 'income', NULL, 'Bank interest', 1.52, 'COP', 'INTERESES LIQUIDADOS', '2026-07-07'),
  (2, 6, 'expense', 'Other', NULL, 30000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-07-06'),
  (2, 7, 'expense', 'Other', NULL, 280000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-07-06'),
  (2, 8, 'expense', 'Other', NULL, 777254.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-07-06'),
  (2, 9, 'expense', 'Other', NULL, 238900.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-07-06'),
  (2, 10, 'expense', 'Other', NULL, 521413.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-07-06'),
  (2, 11, 'expense', 'Other', NULL, 174000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-07-06'),
  (2, 12, 'expense', 'Other', NULL, 85000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-07-06'),
  (2, 13, 'expense', 'Other', NULL, 200000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-07-06'),
  (2, 14, 'expense', 'Taxes', NULL, 9226.27, 'COP', 'GMF', '2026-07-06'),
  (2, 15, 'income', NULL, 'Bank interest', 2.15, 'COP', 'INTERESES LIQUIDADOS', '2026-07-06'),
  (2, 16, 'income', NULL, 'Bank interest', 2.15, 'COP', 'INTERESES LIQUIDADOS', '2026-07-06'),
  (2, 17, 'income', NULL, 'Bank interest', 2.15, 'COP', 'INTERESES LIQUIDADOS', '2026-07-06'),
  (2, 18, 'expense', 'Groceries', NULL, 170900.00, 'COP', 'TIENDA D1 JAMUNDI NAT DI', '2026-07-03'),
  (2, 19, 'expense', 'Food & Dining', NULL, 46000.00, 'COP', 'BOLD SA*KAIROS TA D C', '2026-07-03'),
  (2, 20, 'expense', 'Food & Dining', NULL, 22000.00, 'COP', 'BOLD SA*RESTAURA TA D C', '2026-07-03'),
  (3, 1, 'income', NULL, 'Bank interest', 1.92, 'COP', 'INTERESES LIQUIDADOS', '2026-07-17'),
  (3, 2, 'expense', 'Other', NULL, 68500.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-07-16'),
  (3, 3, 'expense', 'Healthcare', NULL, 10735.00, 'COP', 'DROGUERIA CRUZ VERDE DI', '2026-07-16'),
  (3, 4, 'expense', 'Groceries', NULL, 39060.00, 'COP', 'TIENDA D1 JAMUNDI NAT DI', '2026-07-16'),
  (3, 5, 'expense', 'Groceries', NULL, 68880.00, 'COP', 'TIENDAS ARA DI', '2026-07-16'),
  (3, 6, 'expense', 'Taxes', NULL, 748.70, 'COP', 'GMF', '2026-07-16'),
  (3, 7, 'income', NULL, 'Bank interest', 1.98, 'COP', 'INTERESES LIQUIDADOS', '2026-07-16'),
  (3, 8, 'expense', 'Subscriptions', NULL, 3900.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-07-15'),
  (3, 9, 'income', NULL, 'Bank interest', 1.98, 'COP', 'INTERESES LIQUIDADOS', '2026-07-15'),
  (3, 10, 'expense', 'Taxes', NULL, 15.60, 'COP', 'GMF', '2026-07-15'),
  (3, 11, 'expense', 'Subscriptions', NULL, 3900.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-07-14'),
  (3, 12, 'expense', 'Subscriptions', NULL, 27000.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-07-14'),
  (3, 13, 'expense', 'Utilities', NULL, 35900.00, 'COP', 'MOVISTAR PAGOSEPAYCO TA', '2026-07-14'),
  (3, 14, 'income', NULL, 'Bank interest', 2.00, 'COP', 'INTERESES LIQUIDADOS', '2026-07-14'),
  (3, 15, 'income', NULL, 'Bank interest', 2.00, 'COP', 'INTERESES LIQUIDADOS', '2026-07-14'),
  (3, 16, 'income', NULL, 'Bank interest', 2.00, 'COP', 'INTERESES LIQUIDADOS', '2026-07-14'),
  (3, 17, 'income', NULL, 'Bank interest', 2.00, 'COP', 'INTERESES LIQUIDADOS', '2026-07-14'),
  (3, 18, 'expense', 'Taxes', NULL, 267.20, 'COP', 'GMF', '2026-07-14'),
  (3, 19, 'income', NULL, 'Bank interest', 2.00, 'COP', 'INTERESES LIQUIDADOS', '2026-07-10'),
  (3, 20, 'income', NULL, 'ACH transfer received', 1752458.00, 'COP', 'PAGO TERCERO RECIBIDO DESDE ACH', '2026-07-09');

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM tmp_occidente_july_import) <> 51
     OR (SELECT COUNT(*) FROM tmp_occidente_july_import WHERE row_type = 'expense') <> 34
     OR (SELECT SUM(amount) FROM tmp_occidente_july_import WHERE row_type = 'expense') <> 3262969.88
     OR (SELECT COUNT(*) FROM tmp_occidente_july_import WHERE row_type = 'income') <> 17
     OR (SELECT SUM(amount) FROM tmp_occidente_july_import WHERE row_type = 'income') <> 1752489.50
  THEN
    RAISE EXCEPTION USING MESSAGE = 'July screenshot staging totals failed reconciliation.';
  END IF;
END $$;

DO $$
DECLARE
  v_uid UUID := (SELECT user_id FROM tmp_occidente_july_context LIMIT 1);
  v_name TEXT;
  v_icon TEXT;
  v_color TEXT;
  v_is_default BOOLEAN;
BEGIN
  FOR v_name, v_icon, v_color, v_is_default IN
    SELECT * FROM (VALUES
      ('Food & Dining', 'utensils', '#ef4444', true),
      ('Transportation', 'car', '#f97316', true),
      ('Utilities', 'zap', '#84cc16', true),
      ('Healthcare', 'heart-pulse', '#ec4899', true),
      ('Subscriptions', 'repeat', '#f43f5e', true),
      ('Groceries', 'shopping-cart', '#22c55e', true),
      ('Other', 'more-horizontal', '#64748b', true),
      ('Taxes', 'landmark', '#b91c1c', false)
    ) AS definitions(name, icon, color, is_default)
  LOOP
    INSERT INTO public.categories (id, user_id, name, icon, color, is_default)
    SELECT gen_random_uuid(), CASE WHEN v_is_default THEN NULL ELSE v_uid END, v_name, v_icon, v_color, v_is_default
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categories
      WHERE name = v_name AND (user_id = v_uid OR (v_is_default AND user_id IS NULL))
    );
  END LOOP;
END $$;

CREATE TEMP TABLE tmp_occidente_july_categories AS
WITH ctx AS (SELECT user_id FROM tmp_occidente_july_context LIMIT 1)
SELECT needed.name,
  (
    SELECT categories.id
    FROM public.categories CROSS JOIN ctx
    WHERE categories.name = needed.name
      AND (categories.user_id = ctx.user_id OR categories.user_id IS NULL)
    ORDER BY CASE WHEN categories.user_id = ctx.user_id THEN 0 ELSE 1 END
    LIMIT 1
  ) AS category_id
FROM (VALUES
  ('Food & Dining'),
  ('Transportation'),
  ('Utilities'),
  ('Healthcare'),
  ('Subscriptions'),
  ('Groceries'),
  ('Other'),
  ('Taxes')
) AS needed(name);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM tmp_occidente_july_categories WHERE category_id IS NULL) THEN
    RAISE EXCEPTION USING MESSAGE = 'Category lookup failed for July screenshot import.';
  END IF;
END $$;

WITH ctx AS (SELECT user_id FROM tmp_occidente_july_context LIMIT 1),
ranked_staged AS (
  SELECT staged.*, lookup.category_id,
    ROW_NUMBER() OVER (
      PARTITION BY lookup.category_id, staged.amount, staged.currency, staged.description, staged.date
      ORDER BY staged.screenshot, staged.screenshot_row
    ) AS occurrence
  FROM tmp_occidente_july_import staged
  JOIN tmp_occidente_july_categories lookup ON lookup.name = staged.category_name
  WHERE staged.row_type = 'expense'
),
ranked_existing AS (
  SELECT existing.*,
    ROW_NUMBER() OVER (
      PARTITION BY existing.category_id, existing.amount, existing.currency, COALESCE(existing.description, ''), existing.date
      ORDER BY existing.created_at, existing.id
    ) AS occurrence
  FROM public.expenses existing CROSS JOIN ctx
  WHERE existing.user_id = ctx.user_id
)
INSERT INTO public.expenses (user_id, category_id, amount, currency, description, date)
SELECT ctx.user_id, staged.category_id, staged.amount, staged.currency, staged.description, staged.date
FROM ranked_staged staged CROSS JOIN ctx
LEFT JOIN ranked_existing existing
  ON existing.category_id = staged.category_id
 AND existing.amount = staged.amount
 AND existing.currency = staged.currency
 AND COALESCE(existing.description, '') = staged.description
 AND existing.date = staged.date
 AND existing.occurrence = staged.occurrence
WHERE existing.id IS NULL;

WITH ctx AS (SELECT user_id FROM tmp_occidente_july_context LIMIT 1),
ranked_staged AS (
  SELECT staged.*,
    ROW_NUMBER() OVER (
      PARTITION BY staged.income_source, staged.amount, staged.currency, staged.description, staged.date
      ORDER BY staged.screenshot, staged.screenshot_row
    ) AS occurrence
  FROM tmp_occidente_july_import staged
  WHERE staged.row_type = 'income'
),
ranked_existing AS (
  SELECT existing.*,
    ROW_NUMBER() OVER (
      PARTITION BY existing.source, existing.amount, existing.currency, COALESCE(existing.description, ''), existing.date
      ORDER BY existing.created_at, existing.id
    ) AS occurrence
  FROM public.income_entries existing CROSS JOIN ctx
  WHERE existing.user_id = ctx.user_id
)
INSERT INTO public.income_entries (user_id, source, amount, currency, description, date)
SELECT ctx.user_id, staged.income_source, staged.amount, staged.currency, staged.description, staged.date
FROM ranked_staged staged CROSS JOIN ctx
LEFT JOIN ranked_existing existing
  ON existing.source = staged.income_source
 AND existing.amount = staged.amount
 AND existing.currency = staged.currency
 AND COALESCE(existing.description, '') = staged.description
 AND existing.date = staged.date
 AND existing.occurrence = staged.occurrence
WHERE existing.id IS NULL;

SELECT 'screenshot_rows' AS metric, COUNT(*)::TEXT AS value FROM tmp_occidente_july_import
UNION ALL SELECT 'staged_expenses', COUNT(*)::TEXT FROM tmp_occidente_july_import WHERE row_type = 'expense'
UNION ALL SELECT 'staged_incomes', COUNT(*)::TEXT FROM tmp_occidente_july_import WHERE row_type = 'income'
UNION ALL SELECT 'expense_total_cop', SUM(amount)::TEXT FROM tmp_occidente_july_import WHERE row_type = 'expense'
UNION ALL SELECT 'income_total_cop', SUM(amount)::TEXT FROM tmp_occidente_july_import WHERE row_type = 'income'
UNION ALL SELECT 'resolved_user_id', user_id::TEXT FROM tmp_occidente_july_context;

COMMIT;
