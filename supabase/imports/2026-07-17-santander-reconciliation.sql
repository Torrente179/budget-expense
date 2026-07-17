-- Generated from Santander movimientos.csv
-- Source file: /private/tmp/claude-501/-Users-juanpabloramirez-Desktop-Budget---Expense/f8e8e542-6d83-410a-b6d1-895ca487a42c/scratchpad/missing_movimientos.csv
-- Expenses staged: 246
-- Income/refund rows staged: 21
-- Internal transfers (No computable) are intentionally skipped.
-- If your project has more than one auth user, set v_uid or v_user_email in the first DO block.

BEGIN;

CREATE TEMP TABLE tmp_import_context (user_id UUID NOT NULL);

DO $$
DECLARE
  v_uid UUID := '36d56f02-711b-4eac-80df-803bdb599828';
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
  ('Groceries', 16.38, 'EUR', 'Mercadona Benav', '2025-09-01'),
  ('Food & Dining', 5.70, 'EUR', 'Tip Top Cafeter', '2025-09-01'),
  ('Food & Dining', 3.00, 'EUR', 'Cafeteria Tea', '2025-09-01'),
  ('Food & Dining', 1.80, 'EUR', 'Terraza Parque', '2025-09-01'),
  ('Subscriptions', 3.51, 'EUR', 'Compra servicios web ebanx co, bogota, tarjeta 5489010384852115 , comision 0,10', '2025-09-02'),
  ('Food & Dining', 1.80, 'EUR', 'Terraza Parque', '2025-09-02'),
  ('Shopping', 17.19, 'EUR', 'Compra bizum alipay 02/09/2025', '2025-09-02'),
  ('Transportation', 11.44, 'EUR', 'E. S. La Laguna', '2025-09-03'),
  ('Groceries', 9.03, 'EUR', 'Mercadona-la La', '2025-09-03'),
  ('Food & Dining', 1.80, 'EUR', 'Terraza Parque', '2025-09-03'),
  ('Food & Dining', 1.50, 'EUR', 'Cafeteria Tea', '2025-09-04'),
  ('Food & Dining', 1.80, 'EUR', 'Terraza Parque', '2025-09-04'),
  ('Groceries', 7.87, 'EUR', 'Sd San Antonio', '2025-09-05'),
  ('Groceries', 1.95, 'EUR', 'Mercadona Avda.', '2025-09-05'),
  ('Food & Dining', 14.00, 'EUR', 'Kiosco El Princ', '2025-09-05'),
  ('Donations', 72.00, 'EUR', 'Transfer to Vida Nueva - Ofrendas', '2025-09-05'),
  ('Food & Dining', 3.40, 'EUR', 'Bar Restaura Av', '2025-09-06'),
  ('Travel', 5.80, 'EUR', 'Hotel Playa Sur', '2025-09-06'),
  ('Food & Dining', 5.00, 'EUR', 'Heladeria Picac', '2025-09-06'),
  ('Food & Dining', 2.10, 'EUR', 'Rincon Del Pan', '2025-09-06'),
  ('Food & Dining', 7.00, 'EUR', 'Heladeria Picac', '2025-09-06'),
  ('Food & Dining', 3.70, 'EUR', 'Terraza Parque', '2025-09-06'),
  ('Transportation', 7.67, 'EUR', 'E. S. La Laguna', '2025-09-07'),
  ('Food & Dining', 7.10, 'EUR', 'Caballo Blanco-', '2025-09-07'),
  ('Groceries', 6.27, 'EUR', 'Sd Parque Bulev', '2025-09-08'),
  ('Other', 260.00, 'EUR', 'Transfer to Juan Wise Euro', '2025-09-08'),
  ('Food & Dining', 2.60, 'EUR', 'Cafeteria Cinco', '2025-09-08'),
  ('Food & Dining', 7.50, 'EUR', 'Pizzeria Kebab', '2025-09-08'),
  ('Groceries', 2.84, 'EUR', 'Sd San Antonio', '2025-09-09'),
  ('Groceries', 5.91, 'EUR', 'Sd Parque Bulev', '2025-09-09'),
  ('Food & Dining', 3.30, 'EUR', 'Cafeteria Coral', '2025-09-09'),
  ('Food & Dining', 1.50, 'EUR', 'Cafeteria Tea', '2025-09-09'),
  ('Food & Dining', 1.80, 'EUR', 'Terraza Parque', '2025-09-10'),
  ('Food & Dining', 1.90, 'EUR', 'Terraza Parque', '2025-09-17'),
  ('Food & Dining', 1.95, 'EUR', 'Kiosco La Paz', '2025-10-02'),
  ('Food & Dining', 2.95, 'EUR', 'Compra cafe pergamino 10b, medellin, tarjeta 2115 , comision 0,09', '2026-02-09'),
  ('Groceries', 15.15, 'EUR', 'Hd Parque Bulev', '2026-04-06'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg 5a8pnwsrg8g70, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-20'),
  ('Subscriptions', 6.99, 'EUR', 'Compra apple.com/bill, cork, tarjeta 2115 , comision 0,00', '2026-04-22'),
  ('Shopping', 26.50, 'EUR', 'Compra primark larios centro, malaga, tarjeta 2115 , comision 0,00', '2026-04-22'),
  ('Food & Dining', 1.00, 'EUR', 'E.s. Rincon Vic', '2026-04-20'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-04-20'),
  ('Subscriptions', 19.13, 'EUR', 'Compra google *google one, mountain view, tarjeta 2115 , comision 0,56', '2026-04-23'),
  ('Shopping', 41.80, 'EUR', 'Compra mgp*vinted, vilnius, tarjeta 2115 , comision 0,00', '2026-04-24'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-04-22'),
  ('Food & Dining', 6.99, 'EUR', 'Compra tgtg bnp8594v2pp30, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-27'),
  ('Food & Dining', 3.26, 'EUR', 'Workcafe Malaga', '2026-04-23'),
  ('Healthcare', 42.00, 'EUR', 'Transfer to Juan Wise Euro Concepto Jp Salud Madre', '2026-04-27'),
  ('Groceries', 5.85, 'EUR', 'Mercadona Centr', '2026-04-24'),
  ('Groceries', 1.40, 'EUR', 'Mercadona Villa', '2026-04-24'),
  ('Food & Dining', 6.95, 'EUR', 'Tejeringos Lito', '2026-04-24'),
  ('Food & Dining', 17.50, 'EUR', 'Compra restaurante el mirador, frigiliana, tarjeta 2115 , comision 0,00', '2026-04-28'),
  ('Transportation', 1.00, 'EUR', 'Compra nyx*airservspain, sansebastiand, tarjeta 2115 , comision 0,00', '2026-04-27'),
  ('Food & Dining', 4.61, 'EUR', 'Twins Rincon De', '2026-04-27'),
  ('Food & Dining', 2.00, 'EUR', 'Chambao De Vice', '2026-04-27'),
  ('Transportation', 15.72, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-04-27'),
  ('Food & Dining', 4.99, 'EUR', 'Compra tgtg ar6qpha5h65r0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-28'),
  ('Food & Dining', 3.00, 'EUR', 'Plk 16082 Alame', '2026-04-27'),
  ('Groceries', 1.49, 'EUR', 'Exppzacon', '2026-04-27'),
  ('Food & Dining', 1.70, 'EUR', 'Cafeteria La Es', '2026-04-27'),
  ('Food & Dining', 1.70, 'EUR', 'Espresso Coffe', '2026-04-27'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg a40wgwkgp0fy0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-04-29'),
  ('Subscriptions', 17.62, 'EUR', 'Compra claude.ai subscription, san francisco, tarjeta 2115 , comision 0,51', '2026-04-29'),
  ('Groceries', 11.79, 'EUR', 'Mercadona Puert', '2026-04-27'),
  ('Food & Dining', 4.30, 'EUR', 'Cafeteria La Or', '2026-04-27'),
  ('Groceries', 13.63, 'EUR', 'Mercadona Torre', '2026-04-29'),
  ('Tithe / Diezmo', 150.00, 'EUR', 'Transfer to Juan Wise Euro', '2026-04-29'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-04-28'),
  ('Shopping', 19.24, 'EUR', 'Compra bizum alipay 29/04/2026', '2026-04-29'),
  ('Food & Dining', 4.00, 'EUR', 'Restaurante La', '2026-04-29'),
  ('Food & Dining', 2.80, 'EUR', 'Compra pol print, rincon de la, tarjeta 2115 , comision 0,00', '2026-05-05'),
  ('Shopping', 4.00, 'EUR', 'Tiger Nueva', '2026-04-30'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg 8vh83j0y2hvr0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-08'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg 7smn6sfhfmpb0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-07'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-05-04'),
  ('Other', 28.00, 'EUR', 'Bizum to Pena Lupi Marco Aurelio', '2026-05-06'),
  ('Food & Dining', 7.70, 'EUR', 'El Pan De Lola', '2026-05-06'),
  ('Food & Dining', 3.99, 'EUR', 'Compra tgtg vawthhqnmw4x0, toogoodtogo.e, tarjeta 2115 , comision 0,00', '2026-05-21'),
  ('Food & Dining', 6.90, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-09'),
  ('Food & Dining', 6.70, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-09'),
  ('Food & Dining', 5.50, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-09'),
  ('Food & Dining', 6.70, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-10'),
  ('Food & Dining', 1.70, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-10'),
  ('Food & Dining', 2.84, 'EUR', 'Dia 7739', '2026-06-08'),
  ('Food & Dining', 1.50, 'EUR', 'Terranova', '2026-06-08'),
  ('Food & Dining', 9.70, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-11'),
  ('Groceries', 12.00, 'EUR', 'Mercadona Centr', '2026-06-10'),
  ('Transportation', 2.50, 'EUR', 'Compra chiringuito el muro p, malaga, tarjeta 2115 , comision 0,00', '2026-06-12'),
  ('Food & Dining', 5.60, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-12'),
  ('Subscriptions', 4.99, 'EUR', 'Compra amazon prime*nl1666bf4, luxembourg, tarjeta 2115 , comision 0,00', '2026-06-12'),
  ('Shopping', 28.49, 'EUR', 'Compra www.amazon* nl9gb1ha4, luxembourg, tarjeta 2115 , comision 0,00', '2026-06-12'),
  ('Groceries', 12.20, 'EUR', 'Mercadona Cotom', '2026-06-10'),
  ('Groceries', 5.60, 'EUR', 'Mercadona Torre', '2026-06-11'),
  ('Food & Dining', 4.40, 'EUR', 'Restaurante La', '2026-06-11'),
  ('Food & Dining', 10.70, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-16'),
  ('Subscriptions', 17.91, 'EUR', 'Compra openai *chatgpt subscr, san francisco, tarjeta 2115 , comision 0,52', '2026-06-15'),
  ('Food & Dining', 5.00, 'EUR', 'Bikini Beach', '2026-06-12'),
  ('Donations', 130.00, 'EUR', 'Transfer to Comunidad Cristiana El Cónsul - ofrenda', '2026-06-12'),
  ('Food & Dining', 6.00, 'EUR', '260malaga R Vic', '2026-06-12'),
  ('Food & Dining', 3.71, 'EUR', 'Dia 7739', '2026-06-15'),
  ('Food & Dining', 7.80, 'EUR', 'Bar Casa Jordi', '2026-06-15'),
  ('Food & Dining', 2.00, 'EUR', 'Compra lambik, malaga, tarjeta 2115 , comision 0,00', '2026-06-16'),
  ('Housing', 300.00, 'EUR', 'Transfer to Hafsa Laghzaoui Concepto Alquiler', '2026-06-15'),
  ('Food & Dining', 6.00, 'EUR', 'Hamburgueseria', '2026-06-15'),
  ('Groceries', 14.45, 'EUR', 'Lidl M Laga-c N', '2026-06-15'),
  ('Food & Dining', 48.00, 'EUR', 'Nirvana Gym', '2026-06-16'),
  ('Food & Dining', 7.00, 'EUR', 'Nirvana Gym', '2026-06-15'),
  ('Groceries', 4.51, 'EUR', 'Mercadona Torre', '2026-06-15'),
  ('Food & Dining', 6.10, 'EUR', 'Restaurante La', '2026-06-15'),
  ('Utilities', 54.75, 'EUR', 'Recibo telefonica moviles sa, concepto: mov.xxxxxx366.jun', '2026-06-15'),
  ('Subscriptions', 2.99, 'EUR', 'Compra apple.com/bill, cork, tarjeta 2115 , comision 0,00', '2026-06-18'),
  ('Shopping', 36.56, 'EUR', 'Compra www.amazon* yk43i0215, luxembourg, tarjeta 2115 , comision 0,00', '2026-06-18'),
  ('Shopping', 11.04, 'EUR', 'Compra www.amazon* 9f1pf1rp5, luxembourg, tarjeta 2115 , comision 0,00', '2026-06-18'),
  ('Shopping', 11.99, 'EUR', 'Compra www.amazon* v14a363d5, luxembourg, tarjeta 2115 , comision 0,00', '2026-06-18'),
  ('Groceries', 11.28, 'EUR', 'Mercadona Cotom', '2026-06-17'),
  ('Food & Dining', 7.90, 'EUR', 'Restaurante La', '2026-06-16'),
  ('Professional Services', 53.50, 'EUR', 'Recibo gysecan asesores tenerife, s.l.u. nº recibo 0049 0290 755 bbqlscr ref. mandato z2145884n, de', '2026-06-16'),
  ('Shopping', 29.04, 'EUR', 'Compra amazon mktpl*vx2gq5il3, seattle, tarjeta 2115 , comision 0,00', '2026-06-19'),
  ('Shopping', 15.84, 'EUR', 'Compra amazon mktpl*1e8g94ik3, seattle, tarjeta 2115 , comision 0,00', '2026-06-19'),
  ('Food & Dining', 10.58, 'EUR', 'Dia 7739', '2026-06-17'),
  ('Other', 250.00, 'EUR', 'Retirada de efectivo en cajero automatico 004914260010 el 17/06/2026 a las 10:25..pan:54890103848521', '2026-06-17'),
  ('Food & Dining', 2.00, 'EUR', 'Kiwi Beach Bar', '2026-06-17'),
  ('Healthcare', 58.93, 'EUR', 'Recibo generali espana s.a. seg, concepto: generali salud total de 16/06/2026 a 16/07/2026 primas 58', '2026-06-17'),
  ('Groceries', 3.27, 'EUR', 'Mercadona Cotom', '2026-06-19'),
  ('Food & Dining', 1.15, 'EUR', 'Dia 7739', '2026-06-18'),
  ('Food & Dining', 4.50, 'EUR', 'Dia 7739', '2026-06-18'),
  ('Food & Dining', 3.00, 'EUR', 'Kiwi Beach Bar', '2026-06-18'),
  ('Food & Dining', 5.50, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-22'),
  ('Other', 22.00, 'EUR', 'Bizum to Rafael Eduardo Delgado Rocca - da mimi', '2026-06-22'),
  ('Food & Dining', 12.97, 'EUR', 'Compra bizum motocard bike sl 19/06/2026', '2026-06-22'),
  ('Food & Dining', 8.80, 'EUR', 'Starbucks Feliz', '2026-06-19'),
  ('Groceries', 3.26, 'EUR', 'Mercadona Torre', '2026-06-22'),
  ('Food & Dining', 3.70, 'EUR', 'Capo Bonifati', '2026-06-22'),
  ('Other', 6.30, 'EUR', 'Bizum to Adrian Ernesto Rahn Vieira - raff', '2026-06-22'),
  ('Groceries', 1.45, 'EUR', 'Mercadona Urb L', '2026-06-22'),
  ('Food & Dining', 5.70, 'EUR', 'Restaurante La', '2026-06-22'),
  ('Subscriptions', 20.60, 'EUR', 'Compra google *google one, mountain view, tarjeta 2115 , comision 0,60', '2026-06-23'),
  ('Subscriptions', 5.19, 'EUR', 'Compra uber *one membership u, vorden, tarjeta 2115 , comision 0,15', '2026-06-23'),
  ('Food & Dining', 3.00, 'EUR', 'Compra habana cafe, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-23'),
  ('Groceries', 11.83, 'EUR', 'Express C/ Rond', '2026-06-22'),
  ('Transportation', 15.34, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-06-22'),
  ('Other', 6.00, 'EUR', 'Bizum to Adrian Ernesto Rahn Vieira', '2026-06-22'),
  ('Shopping', 11.89, 'EUR', 'Compra www.amazon* r82b15ed5, luxembourg, tarjeta 2115 , comision 0,00', '2026-06-24'),
  ('Groceries', 3.91, 'EUR', 'Mercadona Cotom', '2026-06-23'),
  ('Groceries', 11.58, 'EUR', 'Mercadona Cotom', '2026-06-24'),
  ('Food & Dining', 3.61, 'EUR', 'Workcafe Malaga', '2026-06-23'),
  ('Food & Dining', 3.61, 'EUR', 'Workcafe Malaga', '2026-06-23'),
  ('Food & Dining', 2.80, 'EUR', 'Workcafe Malaga', '2026-06-23'),
  ('Food & Dining', 2.20, 'EUR', 'Restaurante La', '2026-06-23'),
  ('Groceries', 2.60, 'EUR', 'Mercadona Cotom', '2026-06-25'),
  ('Food & Dining', 2.80, 'EUR', 'Workcafe Malaga', '2026-06-24'),
  ('Food & Dining', 6.00, 'EUR', 'El Capricho De', '2026-06-24'),
  ('Donations', 150.00, 'EUR', 'Transfer to Juan Wise Euro', '2026-06-25'),
  ('Food & Dining', 2.20, 'EUR', 'Restaurante La', '2026-06-25'),
  ('Groceries', 6.65, 'EUR', 'Mercadona Torre', '2026-06-25'),
  ('Taxes', 200.00, 'EUR', 'Compra bizum dgt sanciones internet 2 25/06/2026', '2026-06-25'),
  ('Donations', 110.00, 'EUR', 'Transfer to Comunidad Cristiana El Cónsul', '2026-06-25'),
  ('Food & Dining', 7.00, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-29'),
  ('Food & Dining', 5.00, 'EUR', 'Asoc Cult Torre', '2026-06-29'),
  ('Food & Dining', 10.00, 'EUR', 'Asoc Cult Torre', '2026-06-29'),
  ('Food & Dining', 4.90, 'EUR', 'Starbucks Plaza', '2026-06-26'),
  ('Food & Dining', 6.50, 'EUR', 'Marcos Pareja', '2026-06-26'),
  ('Food & Dining', 6.00, 'EUR', 'El Capricho De', '2026-06-26'),
  ('Food & Dining', 4.90, 'EUR', 'Starbucks Plaza', '2026-06-26'),
  ('Subscriptions', 44.81, 'EUR', 'Compra internet en hsnstore.com, albolote es, tarj. :*852115', '2026-06-26'),
  ('Food & Dining', 5.60, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-06-29'),
  ('Subscriptions', 18.15, 'EUR', 'Compra anthropic* claude sub, san francisco, tarjeta 2115 , comision 0,53', '2026-06-29'),
  ('Food & Dining', 9.90, 'EUR', 'Taj Restaurante', '2026-06-29'),
  ('Shopping', 5.20, 'EUR', 'El Corte Ingles', '2026-06-29'),
  ('Food & Dining', 8.90, 'EUR', 'Taj Restaurante', '2026-06-29'),
  ('Transportation', 17.23, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-06-29'),
  ('Groceries', 14.26, 'EUR', 'Lidl M Laga-c N', '2026-06-29'),
  ('Groceries', 2.49, 'EUR', 'Lidl M Laga-c N', '2026-06-29'),
  ('Other', 4.50, 'EUR', 'Bizum to Rafael Eduardo Delgado Rocca - cerveza', '2026-06-29'),
  ('Food & Dining', 2.20, 'EUR', 'Pancafe Gourmet', '2026-06-29'),
  ('Food & Dining', 6.50, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-07-01'),
  ('Shopping', 19.90, 'EUR', 'Compra www.amazon* 0e9ao7er5, luxembourg, tarjeta 2115 , comision 0,00', '2026-07-01'),
  ('Shopping', 28.12, 'EUR', 'Compra www.amazon* wa9vs07x5, luxembourg, tarjeta 2115 , comision 0,00', '2026-07-01'),
  ('Groceries', 0.30, 'EUR', 'Mercadona Torre', '2026-06-29'),
  ('Groceries', 54.61, 'EUR', 'Mercadona Torre', '2026-06-29'),
  ('Food & Dining', 12.70, 'EUR', 'Restaurante La', '2026-06-29'),
  ('Food & Dining', 6.00, 'EUR', 'El Capricho De', '2026-06-30'),
  ('Food & Dining', 2.80, 'EUR', 'Workcafe Malaga', '2026-06-30'),
  ('Taxes', 299.57, 'EUR', 'TGSS cotizacion 005 r.e.autonomos, concepto: periodo liquidacion: 06/2026-06/2026', '2026-06-30'),
  ('Subscriptions', 0.42, 'EUR', 'Compra google *cloud cmqvkg, mountain view, tarjeta 2115 , comision 0,01', '2026-07-03'),
  ('Food & Dining', 1.60, 'EUR', 'Bar Ciudad Del', '2026-07-01'),
  ('Subscriptions', 5.29, 'EUR', 'Compra servicios web ebanx co, bogota, tarjeta 2115 , comision 0,15', '2026-07-06'),
  ('Groceries', 1.90, 'EUR', 'Mercadona Cotom', '2026-07-03'),
  ('Food & Dining', 6.00, 'EUR', 'El Capricho De', '2026-07-03'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-07-03'),
  ('Groceries', 6.50, 'EUR', 'Compra venta hermanos romero, villanueva de, tarjeta 2115 , comision 0,00', '2026-07-06'),
  ('Groceries', 10.30, 'EUR', 'Mercadona Cotom', '2026-07-06'),
  ('Groceries', 12.60, 'EUR', 'Lidl Antequera', '2026-07-06'),
  ('Food & Dining', 3.60, 'EUR', 'Dlorenzo Antequ', '2026-07-06'),
  ('Transportation', 3.50, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-07-06'),
  ('Food & Dining', 7.80, 'EUR', 'Taj Restaurante', '2026-07-06'),
  ('Food & Dining', 1.80, 'EUR', 'Espresso Coffe', '2026-07-06'),
  ('Groceries', 15.87, 'EUR', 'Mercadona Cotom', '2026-07-07'),
  ('Other', 12.80, 'EUR', 'Bizum to Adrian Ernesto Rahn Vieira - raff', '2026-07-06'),
  ('Groceries', 15.00, 'EUR', 'Compra carniceria medina, malaga, tarjeta 2115 , comision 0,00', '2026-07-09'),
  ('Food & Dining', 4.20, 'EUR', 'Starbucks Plaza', '2026-07-07'),
  ('Groceries', 3.50, 'EUR', 'Frutas Verduras', '2026-07-07'),
  ('Shopping', 5.50, 'EUR', 'Lexperience', '2026-07-07'),
  ('Food & Dining', 4.00, 'EUR', 'Compra heladeria cafeteria di, rincon de la, tarjeta 2115 , comision 0,00', '2026-07-10'),
  ('Food & Dining', 12.50, 'EUR', 'Zaiqa Rincon', '2026-07-09'),
  ('Healthcare', 3.95, 'EUR', 'Farmacia Sanche', '2026-07-08'),
  ('Donations', 140.00, 'EUR', 'Transfer to Comunidad Cristiana El Cónsul', '2026-07-08'),
  ('Other', 2.50, 'EUR', 'Bizum to Monika Domeova - coca cola', '2026-07-08'),
  ('Food & Dining', 7.10, 'EUR', 'Restaurante La', '2026-07-08'),
  ('Food & Dining', 6.40, 'EUR', 'Bueno Cafe', '2026-07-09'),
  ('Groceries', 36.10, 'EUR', 'La Mas Fria Mer', '2026-07-09'),
  ('Food & Dining', 4.00, 'EUR', 'Cafe Bar El 13', '2026-07-09'),
  ('Food & Dining', 8.90, 'EUR', 'La Canasta Lari', '2026-07-09'),
  ('Food & Dining', 4.60, 'EUR', 'La Canasta Lari', '2026-07-09'),
  ('Subscriptions', 18.08, 'EUR', 'Compra openai *chatgpt subscr, san francisco, tarjeta 2115 , comision 0,53', '2026-07-13'),
  ('Subscriptions', 4.99, 'EUR', 'Compra amazon prime*5x7ii5j45, luxembourg, tarjeta 2115 , comision 0,00', '2026-07-13'),
  ('Other', 26.75, 'EUR', 'Bizum to Ruben Canovaca Nieto - salamanca', '2026-07-10'),
  ('Other', 5.00, 'EUR', 'Bizum to Ruben Canovaca Nieto', '2026-07-10'),
  ('Food & Dining', 6.00, 'EUR', 'El Capricho De', '2026-07-10'),
  ('Travel', 13.50, 'EUR', 'Room Mate Valer', '2026-07-10'),
  ('Food & Dining', 3.61, 'EUR', 'Workcafe Malaga', '2026-07-10'),
  ('Food & Dining', 2.31, 'EUR', 'Workcafe Malaga', '2026-07-10'),
  ('Food & Dining', 2.00, 'EUR', 'Horizonte Beach', '2026-07-13'),
  ('Groceries', 12.01, 'EUR', 'Mercadona Torre', '2026-07-13'),
  ('Food & Dining', 7.30, 'EUR', 'Restaurante La', '2026-07-13'),
  ('Transportation', 1.00, 'EUR', 'Compra nyx*airservspain, sansebastiand, tarjeta 2115 , comision 0,00', '2026-07-14'),
  ('Other', 9.00, 'EUR', 'Bizum to Adrian Ernesto Rahn Vieira', '2026-07-13'),
  ('Food & Dining', 1.15, 'EUR', 'Compra internet en waylet, rincon de la es, tarj. :*852115', '2026-07-13'),
  ('Food & Dining', 17.00, 'EUR', 'La Terracita Bu', '2026-07-13'),
  ('Transportation', 18.03, 'EUR', 'Compra internet en repsol waylet, madrid es, tarj. :*852115', '2026-07-13'),
  ('Food & Dining', 6.10, 'EUR', 'Compra el cafe de diego, rincon de la, tarjeta 2115 , comision 0,00', '2026-07-15'),
  ('Food & Dining', 11.35, 'EUR', 'Dia 7739', '2026-07-13'),
  ('Utilities', 53.85, 'EUR', 'Recibo telefonica moviles sa, concepto: mov.xxxxxx366.jul', '2026-07-13'),
  ('Groceries', 7.71, 'EUR', 'Mercadona Cotom', '2026-07-15'),
  ('Utilities', 17.83, 'EUR', 'Compra internet en abba distribuid, 934199023 es, tarj. :*852115', '2026-07-14'),
  ('Food & Dining', 7.00, 'EUR', 'La Casita 33', '2026-07-14'),
  ('Groceries', 7.34, 'EUR', 'Mercadona Cotom', '2026-07-16'),
  ('Food & Dining', 6.10, 'EUR', 'Restaurante La', '2026-07-15'),
  ('Housing', 300.00, 'EUR', 'Transfer to Hafsa Laghzaoui Concepto Renta', '2026-07-15'),
  ('Food & Dining', 10.00, 'EUR', 'Dia 7739', '2026-07-17'),
  ('Other', 250.00, 'EUR', 'Retirada de efectivo en cajero automatico 004969800001 el 16/07/2026 a las 15:15..pan:54890103848521', '2026-07-16'),
  ('Food & Dining', 2.60, 'EUR', 'Bueno Cafe', '2026-07-16'),
  ('Food & Dining', 2.30, 'EUR', 'Bueno Cafe', '2026-07-16'),
  ('Food & Dining', 5.80, 'EUR', 'Kiwi Beach Bar', '2026-07-17'),
  ('Food & Dining', 2.50, 'EUR', 'Chiringuito El', '2026-07-17'),
  ('Healthcare', 58.93, 'EUR', 'Recibo generali espana s.a. seg, concepto: generali salud total de 16/07/2026 a 16/08/2026 primas 58', '2026-07-17');

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
  ('Transfer from Monika Domeova - coffee', 1.50, 'EUR', 'Transferencia inmediata de monika domeova, concepto coffee', '2025-09-01'),
  ('Transfer from Nium Memberdev - rt9023851655', 716.44, 'EUR', 'Transferencia inmediata de nium memberdev, concepto rt9023851655', '2025-09-05'),
  ('Bizum from Mario Alfonso Roman Gonzalez - para airtag', 48.00, 'EUR', 'Bizum de mario alfonso roman gonzalez concepto para airtag', '2025-09-07'),
  ('Bizum from Monika Domeova - el medano', 7.40, 'EUR', 'Bizum de monika domeova concepto el medano', '2025-09-07'),
  ('Bizum from Monika Domeova - coffee', 1.90, 'EUR', 'Bizum de monika domeova concepto coffee', '2025-09-08'),
  ('Transfer from Federica Busco - movistar', 22.50, 'EUR', 'Transferencia de federica busco, concepto movistar', '2025-09-08'),
  ('Bizum from Oscar Di Pasquale - bizum de oscar', 5.00, 'EUR', 'Bizum de oscar di pasquale concepto bizum de oscar', '2025-11-11'),
  ('Transfer from Nium * Memberdev - rt6851220726', 1436.52, 'EUR', 'Transferencia inmediata de nium * memberdev, concepto rt6851220726', '2026-04-28'),
  ('Transfer from Monika Doemeova - movistar may', 22.50, 'EUR', 'Transferencia inmediata de monika doemeova, concepto movistar may', '2026-05-06'),
  ('Transfer from Federica Busco - movistar', 22.50, 'EUR', 'Transferencia de federica busco, concepto movistar', '2026-05-06'),
  ('Transfer from Nium * Memberdev - rt1462377693', 1274.05, 'EUR', 'Transferencia inmediata de nium * memberdev, concepto rt1462377693', '2026-06-12'),
  ('Transfer from Bridge Building Sp. Z.o.o. - payout - sent from arq', 46.00, 'EUR', 'Transferencia inmediata de bridge building sp. z.o.o., concepto payout - sent from arq', '2026-06-12'),
  ('Transfer from Nium * Memberdev - rt4029866947', 1087.29, 'EUR', 'Transferencia inmediata de nium * memberdev, concepto rt4029866947', '2026-06-25'),
  ('Transfer from Bridge Building S.a. - payout - sent from arq', 49.00, 'EUR', 'Transferencia inmediata de bridge building s.a., concepto payout - sent from arq', '2026-07-03'),
  ('Transfer from Bridge Building S.a. - payout - sent from arq', 49.00, 'EUR', 'Transferencia inmediata de bridge building s.a., concepto payout - sent from arq', '2026-07-07'),
  ('Transfer from Federica Busco - movistar', 22.50, 'EUR', 'Transferencia de federica busco, concepto movistar', '2026-07-06'),
  ('Transfer from Monika Doemeova - sent from n26', 3.50, 'EUR', 'Transferencia inmediata de monika doemeova, concepto sent from n26', '2026-07-07'),
  ('Transfer from Monika Doemeova - kebab', 5.50, 'EUR', 'Transferencia inmediata de monika doemeova, concepto kebab', '2026-07-09'),
  ('Transfer from Monika Doemeova - sent from n26', 2.00, 'EUR', 'Transferencia inmediata de monika doemeova, concepto sent from n26', '2026-07-08'),
  ('Transfer from Nium * Memberdev - rt5314435225', 1315.45, 'EUR', 'Transferencia inmediata de nium * memberdev, concepto rt5314435225', '2026-07-08'),
  ('Transfer from Monika Doemeova - food coffees and all', 33.00, 'EUR', 'Transferencia inmediata de monika doemeova, concepto food coffees and all', '2026-07-10');

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

