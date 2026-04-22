-- Generated from Santander movimientos.csv
-- Source file: /Users/juanpabloramirez/Downloads/movimientos (2).csv
-- Expenses staged: 104
-- Income/refund rows staged: 7
-- Internal transfers (No computable) are intentionally skipped.
-- If your project has more than one auth user, set v_uid or v_user_email in the first DO block.

BEGIN;

CREATE TEMP TABLE tmp_import_context (user_id UUID NOT NULL);

DO $$
DECLARE
  v_uid UUID := NULL;
  v_user_email TEXT := NULL;
  v_user_count INTEGER;
  v_resolved_uid UUID;
  v_name TEXT;
  v_icon TEXT;
  v_color TEXT;
  v_is_default BOOLEAN;
BEGIN
  IF v_uid IS NULL AND v_user_email IS NOT NULL THEN
    SELECT id INTO v_uid
    FROM auth.users
    WHERE lower(email) = lower(v_user_email)
    LIMIT 1;
  END IF;

  IF v_uid IS NULL THEN
    SELECT COUNT(*) INTO v_user_count FROM auth.users;
    IF v_user_count = 1 THEN
      SELECT id INTO v_uid FROM auth.users LIMIT 1;
    ELSE
      RAISE EXCEPTION USING MESSAGE =
        'Multiple auth users found. Set v_uid or v_user_email inside this script before running it.';
    END IF;
  END IF;

  SELECT v_uid INTO v_resolved_uid;
  DELETE FROM tmp_import_context;
  INSERT INTO tmp_import_context (user_id) VALUES (v_resolved_uid);

  FOR v_name, v_icon, v_color, v_is_default IN
    SELECT * FROM (VALUES
      ('Food & Dining', 'utensils', '#ef4444', true),
      ('Transportation', 'car', '#f97316', true),
      ('Utilities', 'zap', '#84cc16', true),
      ('Shopping', 'shopping-bag', '#8b5cf6', true),
      ('Healthcare', 'heart-pulse', '#ec4899', true),
      ('Travel', 'plane', '#14b8a6', true),
      ('Subscriptions', 'repeat', '#f43f5e', true),
      ('Groceries', 'shopping-cart', '#22c55e', true),
      ('Other', 'more-horizontal', '#64748b', true)
    ) AS categories(name, icon, color, is_default)
  LOOP
    INSERT INTO public.categories (id, user_id, name, icon, color, is_default)
    SELECT gen_random_uuid(), NULL, v_name, v_icon, v_color, true
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.categories
      WHERE name = v_name AND is_default = true
    );
  END LOOP;

  FOR v_name, v_icon, v_color, v_is_default IN
    SELECT * FROM (VALUES
      ('Taxes', 'landmark', '#b91c1c', false),
      ('Professional Services', 'briefcase', '#0369a1', false),
      ('Donations', 'heart-handshake', '#d97706', false),
      ('Tithe / Diezmo', 'church', '#10b981', false)
    ) AS categories(name, icon, color, is_default)
  LOOP
    INSERT INTO public.categories (id, user_id, name, icon, color, is_default)
    SELECT gen_random_uuid(), NULL, v_name, v_icon, v_color, false
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.categories
      WHERE name = v_name AND user_id IS NULL AND is_default = false
    );
  END LOOP;
END $$;

CREATE TEMP TABLE tmp_category_lookup AS
WITH ctx AS (SELECT user_id FROM tmp_import_context LIMIT 1)
SELECT needed.name,
  (
    SELECT categories.id
    FROM public.categories
    CROSS JOIN ctx
    WHERE categories.name = needed.name
      AND (categories.user_id = ctx.user_id OR categories.user_id IS NULL)
    ORDER BY CASE
      WHEN categories.user_id = ctx.user_id THEN 0
      WHEN categories.is_default = true THEN 1
      ELSE 2
    END
    LIMIT 1
  ) AS category_id
FROM (VALUES
  ('Food & Dining'),
  ('Transportation'),
  ('Utilities'),
  ('Shopping'),
  ('Healthcare'),
  ('Travel'),
  ('Subscriptions'),
  ('Groceries'),
  ('Other'),
  ('Taxes'),
  ('Professional Services'),
  ('Donations'),
  ('Tithe / Diezmo')
) AS needed(name);

CREATE TEMP TABLE tmp_expense_import (
  category_name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL
);

INSERT INTO tmp_expense_import (category_name, amount, currency, description, date)
VALUES
  ('Food & Dining', 2.80, 'EUR', 'Workcafe Malaga', '2026-04-22'),
  ('Food & Dining', 5.70, 'EUR', 'Cafeteria Flor', '2026-04-22'),
  ('Groceries', 22.78, 'EUR', 'Mercadona Torre', '2026-04-21'),
  ('Food & Dining', 5.95, 'EUR', 'Compra panaderia guijarro, la cala del m, tarjeta 2115 , comision 0,00', '2026-04-21'),
  ('Food & Dining', 8.00, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-04-21'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-04-20'),
  ('Food & Dining', 7.00, 'EUR', 'Cafeteria Flor', '2026-04-20'),
  ('Transportation', 15.99, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-04-20'),
  ('Food & Dining', 9.10, 'EUR', 'Cafeteria Las C', '2026-04-20'),
  ('Groceries', 39.37, 'EUR', 'Mercadona Cotom', '2026-04-20'),
  ('Food & Dining', 2.80, 'EUR', 'Heladeria Tramo', '2026-04-20'),
  ('Groceries', 4.90, 'EUR', 'Mercadona Urb L', '2026-04-20'),
  ('Groceries', 5.59, 'EUR', 'Lidl Rincon De', '2026-04-20'),
  ('Food & Dining', 1.00, 'EUR', 'E.s. Rincon Vic', '2026-04-20'),
  ('Food & Dining', 2.00, 'EUR', 'E.s. Rincon Vic', '2026-04-20'),
  ('Groceries', 10.95, 'EUR', 'Mercadona Cotom', '2026-04-20'),
  ('Shopping', 28.90, 'EUR', 'Compra mgp*vinted, vilnius, tarjeta 2115 , comision 0,00', '2026-04-20'),
  ('Food & Dining', 6.95, 'EUR', 'Compra panaderia guijarro, la cala del m, tarjeta 2115 , comision 0,00', '2026-04-20'),
  ('Subscriptions', 2.99, 'EUR', 'Compra apple.com/bill, cork, tarjeta 2115 , comision 0,00', '2026-04-20'),
  ('Food & Dining', 8.29, 'EUR', 'Compra tgtg kk02dbzxw0ff0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-20'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg 5a8pnwsrg8g70, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-20'),
  ('Shopping', 39.73, 'EUR', 'Compra amazon reta* by2qm7z31, seattle, tarjeta 2115 , comision 1,16', '2026-04-20'),
  ('Food & Dining', 15.98, 'EUR', 'City Nueva', '2026-04-20'),
  ('Healthcare', 58.93, 'EUR', 'Recibo generali espana s.a. seg, concepto: generali salud total de 16/04/2026 a 16/05/2026 primas 58', '2026-04-17'),
  ('Groceries', 1.45, 'EUR', 'Exppmerce', '2026-04-17'),
  ('Food & Dining', 8.05, 'EUR', 'Plaza Del Teatr', '2026-04-17'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg jab5r5mmzbr30, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-17'),
  ('Food & Dining', 5.39, 'EUR', 'Compra tgtg sr12eyfmw1fx0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-17'),
  ('Food & Dining', 4.70, 'EUR', 'Starbucks Feliz', '2026-04-17'),
  ('Food & Dining', 2.15, 'EUR', 'Exppzaobi', '2026-04-17'),
  ('Other', 550.00, 'EUR', 'Retirada de efectivo en cajero automatico 004958020092 el 17/04/2026 a las 12:55..pan:54890103848521', '2026-04-17'),
  ('Subscriptions', 17.99, 'EUR', 'Compra apple.com/bill, cork, tarjeta 2115 , comision 0,00', '2026-04-16'),
  ('Food & Dining', 5.61, 'EUR', 'Workcafe Malaga', '2026-04-16'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-04-16'),
  ('Donations', 65.00, 'EUR', 'Transfer to Juan Wise Euro', '2026-04-16'),
  ('Groceries', 3.60, 'EUR', 'Expricondelavic', '2026-04-15'),
  ('Other', 550.00, 'EUR', 'Retirada de efectivo en cajero automatico 004914260010 el 14/04/2026 a las 20:05..pan:54890103848521', '2026-04-15'),
  ('Food & Dining', 4.90, 'EUR', 'Starbucks Plaza', '2026-04-15'),
  ('Food & Dining', 2.80, 'EUR', 'Workcafe Malaga', '2026-04-15'),
  ('Food & Dining', 5.92, 'EUR', 'Workcafe Malaga', '2026-04-15'),
  ('Professional Services', 53.50, 'EUR', 'Recibo gysecan asesores tenerife, s.l.u. nº recibo 0049 0290 755 bbqdghv ref. mandato z2145884n, de', '2026-04-15'),
  ('Tithe / Diezmo', 140.00, 'EUR', 'Transfer to Juan Wise Euro', '2026-04-15'),
  ('Food & Dining', 7.50, 'EUR', 'Taberna Padre J', '2026-04-14'),
  ('Subscriptions', 5.00, 'EUR', 'Compra vpn* y2uaxum1pm, gothenburg, s, tarjeta 2115 , comision 0,00', '2026-04-14'),
  ('Food & Dining', 10.25, 'EUR', 'Moeve El Tajo -', '2026-04-14'),
  ('Food & Dining', 11.56, 'EUR', 'E.s.montealegre', '2026-04-14'),
  ('Groceries', 1.59, 'EUR', 'Dia 29000', '2026-04-14'),
  ('Food & Dining', 11.70, 'EUR', 'Bar Mediterrane', '2026-04-14'),
  ('Groceries', 6.97, 'EUR', 'Dia 29000', '2026-04-14'),
  ('Utilities', 76.94, 'EUR', 'Recibo telefonica moviles sa, concepto: mov.xxxxxx366.abr', '2026-04-13'),
  ('Food & Dining', 2.99, 'EUR', 'Compra tgtg 1xacntze6atj0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-13'),
  ('Shopping', 48.87, 'EUR', 'Compra amazon reta* by3pv9z32, seattle, tarjeta 2115 , comision 1,42', '2026-04-13'),
  ('Food & Dining', 4.99, 'EUR', 'Compra tgtg cv0zbmrns0e80, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-13'),
  ('Subscriptions', 17.70, 'EUR', 'Compra openai *chatgpt subscr, san francisco, tarjeta 2115 , comision 0,52', '2026-04-13'),
  ('Subscriptions', 4.99, 'EUR', 'Compra amazon prime*ni2qf18s4, luxembourg, tarjeta 2115 , comision 0,00', '2026-04-13'),
  ('Food & Dining', 4.80, 'EUR', 'Cafe La Tertuli', '2026-04-13'),
  ('Travel', 468.40, 'EUR', 'Compra airbnb * hmee3ywwqh, luxembourg, tarjeta 2115 , comision 0,00', '2026-04-10'),
  ('Other', 4.00, 'EUR', 'Bizum to Maria Margarita Encalada Jimenez', '2026-04-09'),
  ('Groceries', 2.78, 'EUR', 'Hd Parque Bulev', '2026-04-09'),
  ('Food & Dining', 8.20, 'EUR', 'Tip Top Cafeter', '2026-04-09'),
  ('Food & Dining', 1.95, 'EUR', 'Kiosco La Paz', '2026-04-09'),
  ('Food & Dining', 223.57, 'EUR', 'Niko Motobike', '2026-04-08'),
  ('Food & Dining', 2.00, 'EUR', 'Cafeteria Havan', '2026-04-08'),
  ('Food & Dining', 6.70, 'EUR', 'Sidreria Marian', '2026-04-08'),
  ('Food & Dining', 13.99, 'EUR', 'Sd San Antonio', '2026-04-08'),
  ('Other', 10.00, 'EUR', 'Retirada de efectivo en cajero automatico 004953230000 el 07/04/2026 a las 16:42..pan:54890103848521', '2026-04-07'),
  ('Food & Dining', 5.00, 'EUR', 'Sidreria Marian', '2026-04-07'),
  ('Food & Dining', 2.00, 'EUR', 'Terraza Parque', '2026-04-07'),
  ('Taxes', 207.44, 'EUR', 'Domiciliacion impuesto: 2.026 abonare a.e.a.t', '2026-04-06'),
  ('Taxes', 190.02, 'EUR', 'Domiciliacion impuesto: 2.026 abonare a.e.a.t', '2026-04-06'),
  ('Food & Dining', 8.00, 'EUR', 'Cerveceria La S', '2026-04-06'),
  ('Food & Dining', 2.50, 'EUR', '100 Montaditos', '2026-04-06'),
  ('Food & Dining', 3.80, 'EUR', 'Menester Puerto', '2026-04-06'),
  ('Food & Dining', 7.80, 'EUR', 'Teleferico Pico', '2026-04-06'),
  ('Food & Dining', 5.90, 'EUR', '7 Cañadas', '2026-04-06'),
  ('Food & Dining', 14.50, 'EUR', 'Compra internet en teleferico del, tenerife es, tarj. :*852115', '2026-04-06'),
  ('Food & Dining', 14.50, 'EUR', 'Compra internet en teleferico del, tenerife es, tarj. :*852115', '2026-04-06'),
  ('Transportation', 12.00, 'EUR', 'Carburantes El', '2026-04-06'),
  ('Food & Dining', 2.20, 'EUR', 'Resturante El P', '2026-04-06'),
  ('Food & Dining', 9.80, 'EUR', 'Resturante El P', '2026-04-06'),
  ('Food & Dining', 8.83, 'EUR', 'Tres De Mayo', '2026-04-06'),
  ('Groceries', 6.87, 'EUR', 'Spar Mencey', '2026-04-06'),
  ('Food & Dining', 9.40, 'EUR', 'Bar Benidorm', '2026-04-06'),
  ('Transportation', 0.40, 'EUR', 'Parking La Lagu', '2026-04-06'),
  ('Groceries', 15.15, 'EUR', 'Hd Parque Bulev', '2026-04-06'),
  ('Transportation', 1.35, 'EUR', 'Metropolitano D', '2026-04-06'),
  ('Groceries', 7.38, 'EUR', 'Mercadona-la La', '2026-04-06'),
  ('Food & Dining', 2.99, 'EUR', 'Compra tgtg 2zhtty6amhwm0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-06'),
  ('Transportation', 1.20, 'EUR', 'Compra nyx*airservspain, sansebastiand, tarjeta 2115 , comision 0,00', '2026-04-06'),
  ('Subscriptions', 4.84, 'EUR', 'Compra servicios web ebanx co, bogota, tarjeta 2115 , comision 0,14', '2026-04-06'),
  ('Subscriptions', 1.15, 'EUR', 'Compra google *cloud 2hgzvd, mountain view, tarjeta 2115 , comision 0,03', '2026-04-06'),
  ('Subscriptions', 4.50, 'EUR', 'Compra anthropic, san francisco, tarjeta 2115 , comision 0,13', '2026-04-06'),
  ('Food & Dining', 4.20, 'EUR', 'Compra tgtg 8qf4rfg2yfnt0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-06'),
  ('Food & Dining', 7.90, 'EUR', 'Rincon Lagunero', '2026-04-06'),
  ('Food & Dining', 10.11, 'EUR', 'Compra almacenes exito, envigado, tarjeta 2115 , comision 0,29', '2026-04-02'),
  ('Food & Dining', 4.20, 'EUR', 'Compra tgtg 8zmjxezgcm920, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-02'),
  ('Food & Dining', 2.50, 'EUR', 'Tip Top Cafeter', '2026-04-02'),
  ('Food & Dining', 4.00, 'EUR', 'Cafeteria Coral', '2026-04-02'),
  ('Food & Dining', 1.80, 'EUR', 'Terraza Parque', '2026-04-02'),
  ('Groceries', 7.85, 'EUR', 'Mercadona Av Re', '2026-04-01'),
  ('Donations', 150.00, 'EUR', 'Transfer to Juan Wise Euro', '2026-04-01'),
  ('Food & Dining', 3.20, 'EUR', 'Cafeteria Tea', '2026-04-01'),
  ('Food & Dining', 2.10, 'EUR', 'Lepi Pasteleria', '2026-04-01'),
  ('Food & Dining', 5.60, 'EUR', 'Ibericos Ponce', '2026-04-01');

CREATE TEMP TABLE tmp_income_import (
  source TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL
);

INSERT INTO tmp_income_import (source, amount, currency, description, date)
VALUES
  ('Transfer from Nium * Memberdev - rt5406528306', 1346.34, 'EUR', 'Transferencia inmediata de nium * memberdev, concepto rt5406528306', '2026-04-15'),
  ('Bizum from Federica Busco - movistar', 23.00, 'EUR', 'Bizum de federica busco concepto movistar', '2026-04-13'),
  ('Refund - Airbnb * Hmee3ywwqh', 468.40, 'EUR', 'Devolucion compra en airbnb * hmee3ywwqh, luxembourg, tarjeta 2115 , comision 0,00', '2026-04-13'),
  ('Transfer from Bridge Building Sp. Z.o.o. - payout - sent from arq', 511.80, 'EUR', 'Transferencia inmediata de bridge building sp. z.o.o., concepto payout - sent from arq', '2026-04-13'),
  ('Devolucion compra internet en teleferico del, tenerife es, tarj. :*852115', 14.50, 'EUR', 'Devolucion compra internet en teleferico del, tenerife es, tarj. :*852115', '2026-04-06'),
  ('Devolucion compra internet en teleferico del, tenerife es, tarj. :*852115', 14.50, 'EUR', 'Devolucion compra internet en teleferico del, tenerife es, tarj. :*852115', '2026-04-06'),
  ('Transfer from Federica Busco - movistar', 22.50, 'EUR', 'Transferencia de federica busco, concepto movistar', '2026-04-06');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM tmp_category_lookup WHERE category_id IS NULL) THEN
    RAISE EXCEPTION USING MESSAGE = 'Category lookup failed for one or more staged expense rows.';
  END IF;
END $$;

WITH ctx AS (SELECT user_id FROM tmp_import_context LIMIT 1)
INSERT INTO public.expenses (user_id, category_id, amount, currency, description, date)
SELECT ctx.user_id, lookup.category_id, staged.amount, staged.currency, staged.description, staged.date
FROM tmp_expense_import AS staged
JOIN tmp_category_lookup AS lookup ON lookup.name = staged.category_name
CROSS JOIN ctx
LEFT JOIN public.expenses AS existing
  ON existing.user_id = ctx.user_id
 AND existing.category_id = lookup.category_id
 AND existing.amount = staged.amount
 AND existing.currency = staged.currency
 AND existing.date = staged.date
 AND COALESCE(existing.description, '') = staged.description
WHERE existing.id IS NULL;

WITH ctx AS (SELECT user_id FROM tmp_import_context LIMIT 1)
INSERT INTO public.income_entries (user_id, source, amount, currency, description, date)
SELECT ctx.user_id, staged.source, staged.amount, staged.currency, staged.description, staged.date
FROM tmp_income_import AS staged
CROSS JOIN ctx
LEFT JOIN public.income_entries AS existing
  ON existing.user_id = ctx.user_id
 AND existing.source = staged.source
 AND existing.amount = staged.amount
 AND existing.currency = staged.currency
 AND existing.date = staged.date
 AND COALESCE(existing.description, '') = staged.description
WHERE existing.id IS NULL;

SELECT 'staged_expenses' AS metric, COUNT(*)::TEXT AS value FROM tmp_expense_import
UNION ALL
SELECT 'staged_income_entries', COUNT(*)::TEXT FROM tmp_income_import
UNION ALL
SELECT 'resolved_user_id', user_id::TEXT FROM tmp_import_context;

COMMIT;

