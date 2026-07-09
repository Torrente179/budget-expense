-- Generated from Santander movimientos.csv
-- Source file: /Users/juanpabloramirez/Downloads/movimientos (3).csv
-- Expenses staged: 185
-- Income/refund rows staged: 9
-- Internal transfers (No computable) are intentionally skipped.
-- If your project has more than one auth user, set v_uid or v_user_email in the first DO block.

BEGIN;

CREATE TEMP TABLE tmp_import_context (user_id UUID NOT NULL);

DO $$
DECLARE
  v_uid UUID := NULL;
  v_user_email TEXT := 'pablopablo179@gmail.com';
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
      ('Housing', 'home', '#eab308', true),
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
      ('Personal Care', 'sparkles', '#c026d3', false)
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
  ('Housing'),
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
  ('Personal Care')
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
  ('Donations', 5.00, 'EUR', 'Transfer to Comunidad Cristiana El Cónsul - viaje a misionero angola - extra', '2026-06-08'),
  ('Donations', 5.00, 'EUR', 'Transfer to Comunidad Cristiana El Cónsul - viaje misionero angola', '2026-06-08'),
  ('Food & Dining', 6.04, 'EUR', 'La Canasta Lari', '2026-06-08'),
  ('Food & Dining', 4.50, 'EUR', 'Ice Flambe', '2026-06-08'),
  ('Food & Dining', 7.00, 'EUR', 'Chiringuito El', '2026-06-08'),
  ('Food & Dining', 6.30, 'EUR', 'Brisa Specialty', '2026-06-08'),
  ('Food & Dining', 3.30, 'EUR', 'Plk 16082 Alame', '2026-06-08'),
  ('Food & Dining', 8.00, 'EUR', 'Hamburgueseria', '2026-06-08'),
  ('Food & Dining', 3.40, 'EUR', 'Starbucks Plaza', '2026-06-05'),
  ('Shopping', 2.00, 'EUR', 'Estanco', '2026-06-05'),
  ('Taxes', 208.84, 'EUR', 'Domiciliacion impuesto: 2.026 abonare a.e.a.t', '2026-06-05'),
  ('Groceries', 8.36, 'EUR', 'Mercadona Torre', '2026-06-04'),
  ('Food & Dining', 7.60, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-04'),
  ('Subscriptions', 4.95, 'EUR', 'Compra servicios web ebanx co, bogota, tarjeta 2115 , comision 0,14', '2026-06-04'),
  ('Shopping', 37.90, 'EUR', 'Compra www.amazon* n32kq1ld4, luxembourg, tarjeta 2115 , comision 0,00', '2026-06-04'),
  ('Food & Dining', 2.20, 'EUR', 'Restaurante La', '2026-06-04'),
  ('Food & Dining', 7.20, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-03'),
  ('Shopping', 76.89, 'EUR', 'Compra mgp*vinted, vilnius, tarjeta 2115 , comision 0,00', '2026-06-03'),
  ('Subscriptions', 0.12, 'EUR', 'Compra google *cloud zjtkq2, mountain view, tarjeta 2115 , comision 0,00', '2026-06-03'),
  ('Shopping', 111.76, 'EUR', 'Compra www.amazon* nq25s2wk4, luxembourg, tarjeta 2115 , comision 0,00', '2026-06-03'),
  ('Shopping', 18.03, 'EUR', 'Compra www.amazon* nq24e8ro4, luxembourg, tarjeta 2115 , comision 0,00', '2026-06-03'),
  ('Groceries', 31.38, 'EUR', 'Mercadona Torre', '2026-06-03'),
  ('Food & Dining', 4.40, 'EUR', 'Restaurante La', '2026-06-03'),
  ('Food & Dining', 4.99, 'EUR', 'Compra tgtg pmxyprcrrx6m0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-06-02'),
  ('Food & Dining', 6.20, 'EUR', 'Chiringuito El', '2026-06-02'),
  ('Food & Dining', 9.50, 'EUR', 'Compra chiringuito el muro p, malaga, tarjeta 2115 , comision 0,00', '2026-06-01'),
  ('Food & Dining', 7.00, 'EUR', 'Compra chiringuito el muro p, malaga, tarjeta 2115 , comision 0,00', '2026-06-01'),
  ('Food & Dining', 9.70, 'EUR', 'Dia 7739', '2026-06-01'),
  ('Food & Dining', 2.10, 'EUR', 'Castilfaro', '2026-06-01'),
  ('Shopping', 10.00, 'EUR', 'Estanco', '2026-06-01'),
  ('Food & Dining', 3.70, 'EUR', 'Kalua Helados', '2026-06-01'),
  ('Food & Dining', 7.30, 'EUR', 'Cafeteria Lochi', '2026-06-01'),
  ('Food & Dining', 1.75, 'EUR', 'La Canasta', '2026-06-01'),
  ('Personal Care', 15.98, 'EUR', 'Compra bizum primor 31/05/2026', '2026-06-01'),
  ('Food & Dining', 6.10, 'EUR', 'Restaurante La', '2026-06-01'),
  ('Transportation', 1.35, 'EUR', 'Metro De Malaga', '2026-06-01'),
  ('Shopping', 6.50, 'EUR', 'Estanco Calle N', '2026-06-01'),
  ('Transportation', 1.65, 'EUR', 'Metro De Malaga', '2026-06-01'),
  ('Food & Dining', 5.50, 'EUR', 'Hamburgueseria', '2026-06-01'),
  ('Groceries', 9.48, 'EUR', 'Lidl M Laga-c N', '2026-06-01'),
  ('Taxes', 299.57, 'EUR', 'TGSS cotizacion 005 r.e.autonomos, concepto: periodo liquidacion: 05/2026-05/2026', '2026-05-29'),
  ('Food & Dining', 9.20, 'EUR', 'Compra chiringuito el muro p, malaga, tarjeta 2115 , comision 0,00', '2026-05-29'),
  ('Subscriptions', 17.73, 'EUR', 'Compra claude.ai subscription, san francisco, tarjeta 2115 , comision 0,52', '2026-05-29'),
  ('Groceries', 1.60, 'EUR', 'Mercadona Torre', '2026-05-28'),
  ('Food & Dining', 7.20, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-05-28'),
  ('Food & Dining', 2.50, 'EUR', 'Chiringuito El', '2026-05-28'),
  ('Food & Dining', 2.20, 'EUR', 'Restaurante La', '2026-05-28'),
  ('Groceries', 12.10, 'EUR', 'Mercadona Torre', '2026-05-27'),
  ('Groceries', 25.39, 'EUR', 'Mercadona Torre', '2026-05-27'),
  ('Food & Dining', 4.00, 'EUR', 'Compra tgtg 1jb12aenvbac0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-27'),
  ('Food & Dining', 8.10, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-05-27'),
  ('Donations', 120.00, 'EUR', 'Transfer to Comunidad Cristiana El Cónsul', '2026-05-27'),
  ('Food & Dining', 2.20, 'EUR', 'Restaurante La', '2026-05-27'),
  ('Food & Dining', 2.50, 'EUR', 'Chiringuito El', '2026-05-26'),
  ('Food & Dining', 4.99, 'EUR', 'Compra tgtg e6d748hc1d9j0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-26'),
  ('Food & Dining', 7.41, 'EUR', 'Dia 7739', '2026-05-26'),
  ('Food & Dining', 6.40, 'EUR', 'Granier Cc Muel', '2026-05-25'),
  ('Groceries', 3.45, 'EUR', 'Coviran Teatino', '2026-05-25'),
  ('Food & Dining', 7.30, 'EUR', 'Pancafe Gourmet', '2026-05-25'),
  ('Groceries', 10.66, 'EUR', 'Mercadona Urb L', '2026-05-25'),
  ('Food & Dining', 3.70, 'EUR', 'Capo Bonifati', '2026-05-25'),
  ('Food & Dining', 20.23, 'EUR', 'Bizum to Adrian Ernesto Rahn Vieira - hamburguesa', '2026-05-25'),
  ('Groceries', 2.10, 'EUR', 'Coviran Teatino', '2026-05-25'),
  ('Food & Dining', 10.90, 'EUR', 'Compra restaurante dluna, rincon de la, tarjeta 2115 , comision 0,00', '2026-05-25'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg pxshf1xebsd30, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-25'),
  ('Subscriptions', 18.49, 'EUR', 'Compra google *google one, mountain view, tarjeta 2115 , comision 0,54', '2026-05-25'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg tmy9m7xx3yzq0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-22'),
  ('Food & Dining', 5.92, 'EUR', 'Workcafe Malaga', '2026-05-22'),
  ('Food & Dining', 2.20, 'EUR', 'Restaurante La', '2026-05-22'),
  ('Transportation', 21.94, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-05-21'),
  ('Groceries', 31.65, 'EUR', 'Mercadona Torre', '2026-05-21'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg vawthhqnmw4x0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-21'),
  ('Food & Dining', 4.20, 'EUR', 'Restaurante La', '2026-05-21'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-05-20'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-05-20'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-05-20'),
  ('Personal Care', 16.00, 'EUR', 'Barberia Eleven', '2026-05-20'),
  ('Other', 1.50, 'EUR', 'Terranova', '2026-05-20'),
  ('Groceries', 20.65, 'EUR', 'Mercadona Centr', '2026-05-20'),
  ('Professional Services', 53.50, 'EUR', 'Recibo gysecan asesores tenerife, s.l.u. nº recibo 0049 0290 755 bbqhxlz ref. mandato z2145884n, de', '2026-05-19'),
  ('Healthcare', 58.93, 'EUR', 'Recibo generali espana s.a. seg, concepto: generali salud total de 16/05/2026 a 16/06/2026 primas 58', '2026-05-19'),
  ('Transportation', 6.80, 'EUR', 'E.s. Anher', '2026-05-19'),
  ('Food & Dining', 5.00, 'EUR', 'Compra tgtg wyzfmpeg9zqj0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-19'),
  ('Food & Dining', 9.10, 'EUR', 'Compra ay bendito., rincon de la, tarjeta 2115 , comision 0,00', '2026-05-19'),
  ('Transportation', 1.50, 'EUR', 'Compra gitana loca teatinos, malaga, tarjeta 2115 , comision 0,00', '2026-05-19'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-05-19'),
  ('Other', 250.00, 'EUR', 'Retirada de efectivo en cajero automatico 004969800001 el 19/05/2026 a las 14:21..pan:54890103848521', '2026-05-19'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-05-19'),
  ('Shopping', 13.14, 'EUR', 'Compra mgp*vinted, vilnius, tarjeta 2115 , comision 0,00', '2026-05-18'),
  ('Food & Dining', 6.70, 'EUR', 'Compra restaurante dluna, rincon de la, tarjeta 2115 , comision 0,00', '2026-05-18'),
  ('Food & Dining', 4.99, 'EUR', 'Compra tgtg b7kh77mdbkt30, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-18'),
  ('Subscriptions', 2.99, 'EUR', 'Compra apple.com/bill, cork, tarjeta 2115 , comision 0,00', '2026-05-18'),
  ('Subscriptions', 4.67, 'EUR', 'Compra uber *one membership u, vorden, tarjeta 2115 , comision 0,14', '2026-05-18'),
  ('Food & Dining', 11.90, 'EUR', 'Compra restaurante dluna, rincon de la, tarjeta 2115 , comision 0,00', '2026-05-18'),
  ('Subscriptions', 17.99, 'EUR', 'Compra apple.com/bill, cork, tarjeta 2115 , comision 0,00', '2026-05-18'),
  ('Food & Dining', 2.49, 'EUR', 'Compra tgtg qgqgbrh3aqym0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-18'),
  ('Food & Dining', 6.50, 'EUR', 'Restaurante La', '2026-05-18'),
  ('Other', 1.50, 'EUR', 'Terranova', '2026-05-18'),
  ('Housing', 3.40, 'EUR', 'Ditrento', '2026-05-18'),
  ('Travel', 3.50, 'EUR', 'Parador Malaga', '2026-05-18'),
  ('Food & Dining', 7.00, 'EUR', 'Scaffizo Sl', '2026-05-18'),
  ('Transportation', 19.48, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-05-18'),
  ('Housing', 300.00, 'EUR', 'Transfer to Hafsa Laghzaoui - alquiler jp', '2026-05-18'),
  ('Groceries', 15.10, 'EUR', 'Lidl M Laga-c N', '2026-05-18'),
  ('Groceries', 9.66, 'EUR', 'Mercadona Centr', '2026-05-15'),
  ('Food & Dining', 5.99, 'EUR', 'Compra tgtg 15g848t92gjz0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-15'),
  ('Food & Dining', 6.70, 'EUR', 'Compra restaurante dluna, rincon de la, tarjeta 2115 , comision 0,00', '2026-05-15'),
  ('Food & Dining', 1.49, 'EUR', 'Plaza Del Teatr', '2026-05-15'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-05-15'),
  ('Donations', 81.00, 'EUR', 'Transfer to Comunidad Cristiana El Cónsul - ofrenda', '2026-05-14'),
  ('Food & Dining', 1.70, 'EUR', 'Compra restaurante dluna, rincon de la, tarjeta 2115 , comision 0,00', '2026-05-14'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg 2hpvar0hnpbt0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-14'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-05-14'),
  ('Food & Dining', 3.30, 'EUR', 'Workcafe Malaga', '2026-05-14'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-05-14'),
  ('Other', 70.00, 'EUR', 'Retirada de efectivo en cajero automatico 004914260000 el 13/05/2026 a las 19:06..pan:54890103848521', '2026-05-13'),
  ('Shopping', 15.38, 'EUR', 'Compra mgp*vinted, vilnius, tarjeta 2115 , comision 0,00', '2026-05-13'),
  ('Food & Dining', 5.98, 'EUR', 'Compra tgtg kspa9y9q4pv30, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-13'),
  ('Utilities', 59.52, 'EUR', 'Recibo telefonica moviles sa, concepto: mov.xxxxxx366.may', '2026-05-13'),
  ('Groceries', 5.72, 'EUR', 'Mercadona Cotom', '2026-05-13'),
  ('Shopping', 19.16, 'EUR', 'Compra mgp*vinted, vilnius, tarjeta 2115 , comision 0,00', '2026-05-12'),
  ('Food & Dining', 2.99, 'EUR', 'Compra tgtg 4acwzbkxpcv30, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-12'),
  ('Subscriptions', 17.57, 'EUR', 'Compra openai *chatgpt subscr, san francisco, tarjeta 2115 , comision 0,51', '2026-05-12'),
  ('Subscriptions', 4.99, 'EUR', 'Compra amazon prime*nh75541q4, luxembourg, tarjeta 2115 , comision 0,00', '2026-05-12'),
  ('Shopping', 18.84, 'EUR', 'Compra mgp*vinted, vilnius, tarjeta 2115 , comision 0,00', '2026-05-12'),
  ('Groceries', 3.15, 'EUR', 'Mercadona Urb L', '2026-05-12'),
  ('Transportation', 1.00, 'EUR', 'Compra nyx*airservspain, sansebastiand, tarjeta 2115 , comision 0,00', '2026-05-11'),
  ('Food & Dining', 2.80, 'EUR', 'Workcafe Malaga', '2026-05-11'),
  ('Transportation', 1.00, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-05-11'),
  ('Transportation', 18.10, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-05-11'),
  ('Groceries', 3.29, 'EUR', 'Exppzacon', '2026-05-11'),
  ('Food & Dining', 17.67, 'EUR', 'Bklui', '2026-05-11'),
  ('Food & Dining', 2.20, 'EUR', 'Restaurante La', '2026-05-11'),
  ('Food & Dining', 5.50, 'EUR', 'El Deseo Cafete', '2026-05-11'),
  ('Groceries', 1.79, 'EUR', '0535-sup.openco', '2026-05-11'),
  ('Transportation', 15.49, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-05-11'),
  ('Food & Dining', 8.50, 'EUR', 'Restaurante La', '2026-05-11'),
  ('Food & Dining', 2.80, 'EUR', 'Plk 16082 Alame', '2026-05-11'),
  ('Groceries', 4.17, 'EUR', 'Lidl M Laga-c N', '2026-05-11'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg 8vh83j0y2hvr0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-08'),
  ('Groceries', 31.74, 'EUR', 'Mercadona Cotom', '2026-05-07'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg 7smn6sfhfmpb0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-07'),
  ('Food & Dining', 4.99, 'EUR', 'Compra tgtg x7fw1z1epfw70, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-07'),
  ('Other', 10.00, 'EUR', 'Bizum to David Gonzalez Jara - taza', '2026-05-07'),
  ('Food & Dining', 9.10, 'EUR', 'Restaurante La', '2026-05-07'),
  ('Groceries', 11.25, 'EUR', 'Lidl Rincon De', '2026-05-05'),
  ('Food & Dining', 2.80, 'EUR', 'Compra pol print, rincon de la, tarjeta 2115 , comision 0,00', '2026-05-05'),
  ('Food & Dining', 1.70, 'EUR', 'Compra panaderia guijarro, la cala del m, tarjeta 2115 , comision 0,00', '2026-05-05'),
  ('Food & Dining', 2.00, 'EUR', 'Workcafe Malaga', '2026-05-05'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-05-05'),
  ('Taxes', 208.13, 'EUR', 'Domiciliacion impuesto: 2.026 abonare a.e.a.t', '2026-05-05'),
  ('Groceries', 2.49, 'EUR', 'Lidl Rincon De', '2026-05-04'),
  ('Shopping', 58.65, 'EUR', 'Compra mgp*vinted, vilnius, tarjeta 2115 , comision 0,00', '2026-05-04'),
  ('Shopping', 30.90, 'EUR', 'Compra mgp*vinted, vilnius, tarjeta 2115 , comision 0,00', '2026-05-04'),
  ('Shopping', 57.95, 'EUR', 'Compra mgp*vinted, vilnius, tarjeta 2115 , comision 0,00', '2026-05-04'),
  ('Subscriptions', 4.81, 'EUR', 'Compra servicios web ebanx co, bogota, tarjeta 2115 , comision 0,14', '2026-05-04'),
  ('Subscriptions', 0.85, 'EUR', 'Compra google *cloud 4sz6m7, mountain view, tarjeta 2115 , comision 0,02', '2026-05-04'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-05-04'),
  ('Donations', 400.00, 'EUR', 'Transfer to Juan Wise Euro', '2026-05-04'),
  ('Food & Dining', 13.00, 'EUR', 'Transaccion contactless en la terracita bu, canadas, las es, tarj. :*852115', '2026-05-04'),
  ('Food & Dining', 16.84, 'EUR', 'Benalmadena', '2026-05-04'),
  ('Food & Dining', 2.45, 'EUR', 'Supercaro', '2026-05-04'),
  ('Food & Dining', 4.50, 'EUR', 'Caseta Alemania', '2026-05-04'),
  ('Food & Dining', 2.00, 'EUR', 'Delicias De Por', '2026-05-04'),
  ('Groceries', 1.80, 'EUR', 'Alimentacion Ba', '2026-05-04'),
  ('Food & Dining', 6.00, 'EUR', 'Hamburgueseria', '2026-05-04'),
  ('Groceries', 4.07, 'EUR', 'Lidl M Laga-c N', '2026-05-04'),
  ('Food & Dining', 6.00, 'EUR', 'Bar La Taskita', '2026-05-04'),
  ('Other', 4.00, 'EUR', 'Bizum to Adrian Ernesto Rahn Vieira', '2026-05-04'),
  ('Food & Dining', 6.90, 'EUR', 'Restaurante La', '2026-05-04'),
  ('Food & Dining', 2.20, 'EUR', 'Restaurante La', '2026-05-04'),
  ('Food & Dining', 10.50, 'EUR', 'Hamburgueseria', '2026-05-04'),
  ('Food & Dining', 9.30, 'EUR', 'Espresso Coffe', '2026-05-04'),
  ('Food & Dining', 6.90, 'EUR', 'Restaurante La', '2026-05-04'),
  ('Food & Dining', 2.20, 'EUR', 'Restaurante La', '2026-05-04'),
  ('Taxes', 299.57, 'EUR', 'TGSS cotizacion 005 r.e.autonomos, concepto: periodo liquidacion: 04/2026-04/2026', '2026-04-30'),
  ('Food & Dining', 5.99, 'EUR', 'Compra tgtg eq7nqtg7f76b0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-30'),
  ('Food & Dining', 2.50, 'EUR', 'Como En Casa', '2026-04-30'),
  ('Food & Dining', 5.90, 'EUR', 'Granier', '2026-04-30'),
  ('Food & Dining', 3.61, 'EUR', 'Workcafe Malaga', '2026-04-30'),
  ('Shopping', 14.99, 'EUR', 'Compra bizum decathlon 30/04/2026', '2026-04-30'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-04-30'),
  ('Shopping', 4.00, 'EUR', 'Tiger Nueva', '2026-04-30'),
  ('Transportation', 14.20, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-04-30'),
  ('Food & Dining', 5.70, 'EUR', 'Restaurante La', '2026-04-30');

-- Ensure income ledger table exists in projects created before the income feature.
CREATE TABLE IF NOT EXISTS public.income_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (char_length(btrim(source)) > 0 AND char_length(source) <= 100),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_income_entries_user_id
    ON public.income_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_income_entries_date
    ON public.income_entries(user_id, date);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_income_entries ON public.income_entries;
CREATE TRIGGER set_updated_at_income_entries
    BEFORE UPDATE ON public.income_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'income_entries'
      AND policyname = 'Users can view own income entries'
  ) THEN
    CREATE POLICY "Users can view own income entries"
      ON public.income_entries FOR SELECT USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'income_entries'
      AND policyname = 'Users can insert own income entries'
  ) THEN
    CREATE POLICY "Users can insert own income entries"
      ON public.income_entries FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'income_entries'
      AND policyname = 'Users can update own income entries'
  ) THEN
    CREATE POLICY "Users can update own income entries"
      ON public.income_entries FOR UPDATE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'income_entries'
      AND policyname = 'Users can delete own income entries'
  ) THEN
    CREATE POLICY "Users can delete own income entries"
      ON public.income_entries FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

CREATE TEMP TABLE tmp_income_import (
  source TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL
);

INSERT INTO tmp_income_import (source, amount, currency, description, date)
VALUES
  ('Transfer from Federica Busco - movistar', 22.50, 'EUR', 'Transferencia de federica busco, concepto movistar', '2026-06-08'),
  ('Refund - Mgp*vinted', 76.89, 'EUR', 'Devolucion compra en mgp*vinted, vilnius, tarjeta 2115 , comision 0,00', '2026-06-03'),
  ('Transfer from Nium * Memberdev - rt1194334416', 1164.25, 'EUR', 'Transferencia inmediata de nium * memberdev, concepto rt1194334416', '2026-05-27'),
  ('Transfer from Bridge Building Sp. Z.o.o. - payout - sent from arq', 44.00, 'EUR', 'Transferencia inmediata de bridge building sp. z.o.o., concepto payout - sent from arq', '2026-05-25'),
  ('Transfer from Bridge Building Sp. Z.o.o. - payout - sent from arq', 84.00, 'EUR', 'Transferencia inmediata de bridge building sp. z.o.o., concepto payout - sent from arq', '2026-05-21'),
  ('Transfer from Bridge Building Sp. Z.o.o. - payout - sent from arq', 178.00, 'EUR', 'Transferencia inmediata de bridge building sp. z.o.o., concepto payout - sent from arq', '2026-05-18'),
  ('Transfer from Nium * Memberdev - rt6531819515', 805.71, 'EUR', 'Transferencia inmediata de nium * memberdev, concepto rt6531819515', '2026-05-14'),
  ('Refund - Workcafe Malaga', 3.30, 'EUR', 'Devolucion compra en workcafe malaga, malaga es, tarj. :*852115', '2026-05-14'),
  ('Transfer from Bridge Building Sp. Z.o.o. - payout - sent from arq', 85.00, 'EUR', 'Transferencia inmediata de bridge building sp. z.o.o., concepto payout - sent from arq', '2026-05-08');

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
