-- Banco de Occidente statements, January-June 2026.
-- Source order: ExtractoOccidente.pdf, then (1) through (5).
-- Reconciled rows: 525 (324 expenses, 201 incomes).
-- Target account requested: doralisderamirez@gmail.com

BEGIN;

CREATE TEMP TABLE tmp_occidente_context (user_id UUID NOT NULL);

DO $$
DECLARE
  v_email TEXT := 'doralisderamirez@gmail.com';
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'No Auth user found for Banco de Occidente import target: ' || v_email;
  END IF;
  INSERT INTO tmp_occidente_context (user_id) VALUES (v_uid);
END $$;

CREATE TEMP TABLE tmp_occidente_expected (
  statement_index INTEGER PRIMARY KEY,
  debit_count INTEGER NOT NULL,
  debit_total DECIMAL(14, 2) NOT NULL,
  credit_count INTEGER NOT NULL,
  credit_total DECIMAL(14, 2) NOT NULL
);

INSERT INTO tmp_occidente_expected VALUES
(0, 56, 7226009.88, 34, 5113228.48),
  (1, 42, 5014028.21, 30, 5163214.87),
  (2, 35, 3011124.51, 33, 3445797.31),
  (3, 59, 5508600.62, 33, 5113216.45),
  (4, 71, 5917408.35, 37, 7895679.55),
  (5, 61, 6333757.11, 34, 9404054.41);

CREATE TEMP TABLE tmp_occidente_import (
  statement_index INTEGER NOT NULL,
  statement_row INTEGER NOT NULL,
  row_type TEXT NOT NULL CHECK (row_type IN ('expense', 'income')),
  category_name TEXT,
  income_source TEXT,
  amount DECIMAL(14, 2) NOT NULL,
  currency TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  PRIMARY KEY (statement_index, statement_row)
);

INSERT INTO tmp_occidente_import VALUES
  (0, 1, 'expense', 'Other', NULL, 165086.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-02'),
  (0, 2, 'expense', 'Other', NULL, 91000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-02'),
  (0, 3, 'expense', 'Other', NULL, 67000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-02'),
  (0, 4, 'income', NULL, 'Bank interest', 1.48, 'COP', 'INTERESES LIQUIDADOS', '2026-01-02'),
  (0, 5, 'expense', 'Taxes', NULL, 1292.34, 'COP', 'GMF', '2026-01-02'),
  (0, 6, 'income', NULL, 'Bank interest', 1.39, 'COP', 'INTERESES LIQUIDADOS', '2026-01-05'),
  (0, 7, 'income', NULL, 'Bank interest', 1.39, 'COP', 'INTERESES LIQUIDADOS', '2026-01-05'),
  (0, 8, 'income', NULL, 'Bank interest', 1.39, 'COP', 'INTERESES LIQUIDADOS', '2026-01-05'),
  (0, 9, 'income', NULL, 'ACH transfer received', 1667420.00, 'COP', 'PAGO TERCERO RECIBIDO DESDE ACH', '2026-01-06'),
  (0, 10, 'expense', 'Food & Dining', NULL, 27000.00, 'COP', 'PANADERIA EL SAMAN NDI', '2026-01-06'),
  (0, 11, 'expense', 'Groceries', NULL, 288730.00, 'COP', 'TIENDA D1 JAMUNDI VER DI', '2026-01-06'),
  (0, 12, 'expense', 'Groceries', NULL, 170800.00, 'COP', 'TIENDAS ARA DI', '2026-01-06'),
  (0, 13, 'expense', 'Other', NULL, 400000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-06'),
  (0, 14, 'income', NULL, 'Bank interest', 1.39, 'COP', 'INTERESES LIQUIDADOS', '2026-01-06'),
  (0, 15, 'expense', 'Taxes', NULL, 3546.12, 'COP', 'GMF', '2026-01-06'),
  (0, 16, 'expense', 'Other', NULL, 383600.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-07'),
  (0, 17, 'expense', 'Other', NULL, 217200.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-07'),
  (0, 18, 'expense', 'Other', NULL, 212576.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-07'),
  (0, 19, 'expense', 'Other', NULL, 174000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-07'),
  (0, 20, 'expense', 'Other', NULL, 47250.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-07'),
  (0, 21, 'expense', 'Other', NULL, 592900.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-07'),
  (0, 22, 'expense', 'Other', NULL, 12300.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-07'),
  (0, 23, 'income', NULL, 'Bank interest', 1.61, 'COP', 'INTERESES LIQUIDADOS', '2026-01-07'),
  (0, 24, 'expense', 'Taxes', NULL, 6559.30, 'COP', 'GMF', '2026-01-07'),
  (0, 25, 'expense', 'Other', NULL, 169900.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-08'),
  (0, 26, 'income', NULL, 'Bank interest', 1.16, 'COP', 'INTERESES LIQUIDADOS', '2026-01-08'),
  (0, 27, 'expense', 'Taxes', NULL, 679.60, 'COP', 'GMF', '2026-01-08'),
  (0, 28, 'expense', 'Other', NULL, 45000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-09'),
  (0, 29, 'expense', 'Other', NULL, 50000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-09'),
  (0, 30, 'income', NULL, 'Bank interest', 1.11, 'COP', 'INTERESES LIQUIDADOS', '2026-01-09'),
  (0, 31, 'expense', 'Taxes', NULL, 380.00, 'COP', 'GMF', '2026-01-09'),
  (0, 32, 'expense', 'Personal Care', NULL, 95900.00, 'COP', 'KRIKA COSMETIC INTERN', '2026-01-13'),
  (0, 33, 'expense', 'Shopping', NULL, 33000.00, 'COP', 'DOLLARCITY CC ALFAGUA NDI', '2026-01-13'),
  (0, 34, 'expense', 'Food & Dining', NULL, 28000.00, 'COP', 'PANADERIA EL SAMAN NDI', '2026-01-13'),
  (0, 35, 'expense', 'Utilities', NULL, 33489.00, 'COP', 'MOVISTAR PAGOSEPAYCO TA', '2026-01-13'),
  (0, 36, 'expense', 'Other', NULL, 115000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-13'),
  (0, 37, 'expense', 'Other', NULL, 120000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-13'),
  (0, 38, 'income', NULL, 'Bank interest', 1.08, 'COP', 'INTERESES LIQUIDADOS', '2026-01-13'),
  (0, 39, 'income', NULL, 'Bank interest', 1.08, 'COP', 'INTERESES LIQUIDADOS', '2026-01-13'),
  (0, 40, 'income', NULL, 'Bank interest', 1.08, 'COP', 'INTERESES LIQUIDADOS', '2026-01-13'),
  (0, 41, 'income', NULL, 'Bank interest', 1.08, 'COP', 'INTERESES LIQUIDADOS', '2026-01-13'),
  (0, 42, 'expense', 'Taxes', NULL, 1701.56, 'COP', 'GMF', '2026-01-13'),
  (0, 43, 'income', NULL, 'Bank interest', 0.97, 'COP', 'INTERESES LIQUIDADOS', '2026-01-14'),
  (0, 44, 'expense', 'Other', NULL, 100000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-15'),
  (0, 45, 'income', NULL, 'Bank interest', 0.97, 'COP', 'INTERESES LIQUIDADOS', '2026-01-15'),
  (0, 46, 'expense', 'Taxes', NULL, 400.00, 'COP', 'GMF', '2026-01-15'),
  (0, 47, 'income', NULL, 'Bank interest', 0.94, 'COP', 'INTERESES LIQUIDADOS', '2026-01-16'),
  (0, 48, 'expense', 'Groceries', NULL, 60000.00, 'COP', 'CARNICERIA Y SALS LOS DI', '2026-01-19'),
  (0, 49, 'expense', 'Other', NULL, 318000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-19'),
  (0, 50, 'expense', 'Other', NULL, 35000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-19'),
  (0, 51, 'expense', 'Food & Dining', NULL, 23300.00, 'COP', 'SUBWAY BODYTECH SANTA', '2026-01-19'),
  (0, 52, 'expense', 'Shopping', NULL, 99000.00, 'COP', 'DOLLARCITY CENCO MALL', '2026-01-19'),
  (0, 53, 'income', NULL, 'Bank interest', 0.94, 'COP', 'INTERESES LIQUIDADOS', '2026-01-19'),
  (0, 54, 'income', NULL, 'Bank interest', 0.94, 'COP', 'INTERESES LIQUIDADOS', '2026-01-19'),
  (0, 55, 'income', NULL, 'Bank interest', 0.94, 'COP', 'INTERESES LIQUIDADOS', '2026-01-19'),
  (0, 56, 'expense', 'Taxes', NULL, 2141.20, 'COP', 'GMF', '2026-01-19'),
  (0, 57, 'income', NULL, 'Bank interest', 0.79, 'COP', 'INTERESES LIQUIDADOS', '2026-01-20'),
  (0, 58, 'income', NULL, 'Bank interest', 0.79, 'COP', 'INTERESES LIQUIDADOS', '2026-01-21'),
  (0, 59, 'income', NULL, 'Bank interest', 0.79, 'COP', 'INTERESES LIQUIDADOS', '2026-01-22'),
  (0, 60, 'income', NULL, 'Bank interest', 0.79, 'COP', 'INTERESES LIQUIDADOS', '2026-01-23'),
  (0, 61, 'expense', 'Other', NULL, 100000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-26'),
  (0, 62, 'expense', 'Other', NULL, 20940.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-26'),
  (0, 63, 'expense', 'Other', NULL, 33680.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-26'),
  (0, 64, 'expense', 'Other', NULL, 123600.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-26'),
  (0, 65, 'expense', 'Other', NULL, 3865.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-26'),
  (0, 66, 'expense', 'Other', NULL, 12760.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-26'),
  (0, 67, 'expense', 'Other', NULL, 2168050.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-26'),
  (0, 68, 'expense', 'Other', NULL, 101150.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-01-26'),
  (0, 69, 'income', NULL, 'Bank interest', 0.79, 'COP', 'INTERESES LIQUIDADOS', '2026-01-26'),
  (0, 70, 'income', NULL, 'Bank interest', 0.79, 'COP', 'INTERESES LIQUIDADOS', '2026-01-26'),
  (0, 71, 'income', NULL, 'Bank interest', 0.79, 'COP', 'INTERESES LIQUIDADOS', '2026-01-26'),
  (0, 72, 'expense', 'Taxes', NULL, 10256.18, 'COP', 'GMF', '2026-01-26'),
  (0, 73, 'expense', 'Food & Dining', NULL, 46000.00, 'COP', 'GOURMET CHARDY EXPRES NDI', '2026-01-27'),
  (0, 74, 'expense', 'Other', NULL, 11900.00, 'COP', 'CC ALFAGUARA A', '2026-01-27'),
  (0, 75, 'expense', 'Transportation', NULL, 90145.00, 'COP', 'ESTACION DE SERVICIO', '2026-01-27'),
  (0, 76, 'expense', 'Shopping', NULL, 35000.00, 'COP', 'DOLLARCITY CC ALFAGUA NDI', '2026-01-27'),
  (0, 77, 'income', NULL, 'Bank interest', 0.09, 'COP', 'INTERESES LIQUIDADOS', '2026-01-27'),
  (0, 78, 'expense', 'Taxes', NULL, 732.18, 'COP', 'GMF', '2026-01-27'),
  (0, 79, 'income', NULL, 'Bank interest', 0.04, 'COP', 'INTERESES LIQUIDADOS', '2026-01-28'),
  (0, 80, 'income', NULL, 'Bank interest', 0.04, 'COP', 'INTERESES LIQUIDADOS', '2026-01-29'),
  (0, 81, 'income', NULL, 'Transfer from own account', 1681505.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-01-30'),
  (0, 82, 'income', NULL, 'Transfer from own account', 1764275.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-01-30'),
  (0, 83, 'expense', 'Shopping', NULL, 21000.00, 'COP', 'DOLLARCITY HOLGUINES', '2026-01-30'),
  (0, 84, 'expense', 'Food & Dining', NULL, 80000.00, 'COP', 'KABUK', '2026-01-30'),
  (0, 85, 'expense', 'Food & Dining', NULL, 54000.00, 'COP', 'REXICO Q92 DI', '2026-01-30'),
  (0, 86, 'expense', 'Other', NULL, 120100.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-01-30'),
  (0, 87, 'income', NULL, 'Bank interest', 0.04, 'COP', 'INTERESES LIQUIDADOS', '2026-01-30'),
  (0, 88, 'income', NULL, 'Bank interest', 0.90, 'COP', 'INTERESES LIQUIDADOS', '2026-01-30'),
  (0, 89, 'income', NULL, 'Bank interest', 0.90, 'COP', 'INTERESES LIQUIDADOS', '2026-01-30'),
  (0, 90, 'expense', 'Taxes', NULL, 1100.40, 'COP', 'GMF', '2026-01-30'),
  (1, 1, 'expense', 'Food & Dining', NULL, 14000.00, 'COP', 'EL ANTOJO DE JAMUNDI NDI', '2026-02-02'),
  (1, 2, 'expense', 'Other', NULL, 120000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-02-02'),
  (1, 3, 'income', NULL, 'Bank interest', 0.90, 'COP', 'INTERESES LIQUIDADOS', '2026-02-02'),
  (1, 4, 'expense', 'Taxes', NULL, 536.00, 'COP', 'GMF', '2026-02-02'),
  (1, 5, 'income', NULL, 'Bank interest', 0.87, 'COP', 'INTERESES LIQUIDADOS', '2026-02-03'),
  (1, 6, 'income', NULL, 'Bank interest', 0.87, 'COP', 'INTERESES LIQUIDADOS', '2026-02-04'),
  (1, 7, 'expense', 'Other', NULL, 30000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-02-05'),
  (1, 8, 'income', NULL, 'Bank interest', 0.87, 'COP', 'INTERESES LIQUIDADOS', '2026-02-05'),
  (1, 9, 'expense', 'Taxes', NULL, 120.00, 'COP', 'GMF', '2026-02-05'),
  (1, 10, 'expense', 'Other', NULL, 50000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-02-06'),
  (1, 11, 'income', NULL, 'Bank interest', 0.86, 'COP', 'INTERESES LIQUIDADOS', '2026-02-06'),
  (1, 12, 'expense', 'Taxes', NULL, 200.00, 'COP', 'GMF', '2026-02-06'),
  (1, 13, 'expense', 'Other', NULL, 16000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-02-09'),
  (1, 14, 'expense', 'Food & Dining', NULL, 57000.00, 'COP', 'PANADERIA EL SAMAN NDI', '2026-02-09'),
  (1, 15, 'expense', 'Groceries', NULL, 86470.00, 'COP', 'TIENDA D1 JAMUNDI NAT DI', '2026-02-09'),
  (1, 16, 'income', NULL, 'ACH transfer received', 1667420.00, 'COP', 'PAGO TERCERO RECIBIDO DESDE ACH', '2026-02-09'),
  (1, 17, 'expense', 'Other', NULL, 174000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-02-09'),
  (1, 18, 'expense', 'Other', NULL, 422400.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-09'),
  (1, 19, 'expense', 'Other', NULL, 212576.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-09'),
  (1, 20, 'expense', 'Other', NULL, 100000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-02-09'),
  (1, 21, 'expense', 'Other', NULL, 239622.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-09'),
  (1, 22, 'expense', 'Other', NULL, 580000.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-09'),
  (1, 23, 'expense', 'Other', NULL, 473500.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-09'),
  (1, 24, 'expense', 'Other', NULL, 116300.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-09'),
  (1, 25, 'expense', 'Other', NULL, 414000.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-09'),
  (1, 26, 'income', NULL, 'Bank interest', 0.85, 'COP', 'INTERESES LIQUIDADOS', '2026-02-09'),
  (1, 27, 'income', NULL, 'Bank interest', 0.85, 'COP', 'INTERESES LIQUIDADOS', '2026-02-09'),
  (1, 28, 'income', NULL, 'Bank interest', 0.85, 'COP', 'INTERESES LIQUIDADOS', '2026-02-09'),
  (1, 29, 'expense', 'Taxes', NULL, 11567.47, 'COP', 'GMF', '2026-02-09'),
  (1, 30, 'income', NULL, 'Bank interest', 0.51, 'COP', 'INTERESES LIQUIDADOS', '2026-02-10'),
  (1, 31, 'income', NULL, 'Bank interest', 0.51, 'COP', 'INTERESES LIQUIDADOS', '2026-02-11'),
  (1, 32, 'income', NULL, 'Bank transfer received', 50000.00, 'COP', 'BRE-B RECIBIDA OTROS BANCOS', '2026-02-12'),
  (1, 33, 'expense', 'Utilities', NULL, 33489.00, 'COP', 'MOVISTAR PAGOSEPAYCO TA', '2026-02-12'),
  (1, 34, 'income', NULL, 'Bank interest', 0.51, 'COP', 'INTERESES LIQUIDADOS', '2026-02-12'),
  (1, 35, 'expense', 'Taxes', NULL, 133.96, 'COP', 'GMF', '2026-02-12'),
  (1, 36, 'expense', 'Subscriptions', NULL, 3900.00, 'COP', 'APPLE.COM BILL RTINO', '2026-02-13'),
  (1, 37, 'income', NULL, 'Bank interest', 0.51, 'COP', 'INTERESES LIQUIDADOS', '2026-02-13'),
  (1, 38, 'expense', 'Taxes', NULL, 15.60, 'COP', 'GMF', '2026-02-13'),
  (1, 39, 'expense', 'Other', NULL, 498000.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-16'),
  (1, 40, 'income', NULL, 'Bank interest', 0.51, 'COP', 'INTERESES LIQUIDADOS', '2026-02-16'),
  (1, 41, 'income', NULL, 'Bank interest', 0.51, 'COP', 'INTERESES LIQUIDADOS', '2026-02-16'),
  (1, 42, 'income', NULL, 'Bank interest', 0.51, 'COP', 'INTERESES LIQUIDADOS', '2026-02-16'),
  (1, 43, 'expense', 'Taxes', NULL, 1992.00, 'COP', 'GMF', '2026-02-16'),
  (1, 44, 'income', NULL, 'Bank interest', 0.37, 'COP', 'INTERESES LIQUIDADOS', '2026-02-17'),
  (1, 45, 'expense', 'Other', NULL, 111540.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-02-18'),
  (1, 46, 'income', NULL, 'Bank interest', 0.37, 'COP', 'INTERESES LIQUIDADOS', '2026-02-18'),
  (1, 47, 'expense', 'Taxes', NULL, 446.16, 'COP', 'GMF', '2026-02-18'),
  (1, 48, 'expense', 'Other', NULL, 115000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-02-19'),
  (1, 49, 'income', NULL, 'Bank interest', 0.34, 'COP', 'INTERESES LIQUIDADOS', '2026-02-19'),
  (1, 50, 'expense', 'Taxes', NULL, 460.00, 'COP', 'GMF', '2026-02-19'),
  (1, 51, 'income', NULL, 'Bank interest', 0.31, 'COP', 'INTERESES LIQUIDADOS', '2026-02-20'),
  (1, 52, 'expense', 'Food & Dining', NULL, 28000.00, 'COP', 'PANADERIA EL SAMAN NDI', '2026-02-23'),
  (1, 53, 'expense', 'Groceries', NULL, 270035.00, 'COP', 'TIENDAS ARA DI', '2026-02-23'),
  (1, 54, 'expense', 'Groceries', NULL, 19950.00, 'COP', 'TIENDA D1 JAMUNDI VER DI', '2026-02-23'),
  (1, 55, 'expense', 'Other', NULL, 500000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-02-23'),
  (1, 56, 'income', NULL, 'Bank interest', 0.31, 'COP', 'INTERESES LIQUIDADOS', '2026-02-23'),
  (1, 57, 'income', NULL, 'Bank interest', 0.31, 'COP', 'INTERESES LIQUIDADOS', '2026-02-23'),
  (1, 58, 'income', NULL, 'Bank interest', 0.31, 'COP', 'INTERESES LIQUIDADOS', '2026-02-23'),
  (1, 59, 'expense', 'Taxes', NULL, 3271.94, 'COP', 'GMF', '2026-02-23'),
  (1, 60, 'income', NULL, 'Bank interest', 0.09, 'COP', 'INTERESES LIQUIDADOS', '2026-02-24'),
  (1, 61, 'expense', 'Other', NULL, 54620.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-25'),
  (1, 62, 'expense', 'Other', NULL, 124750.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-25'),
  (1, 63, 'expense', 'Other', NULL, 101160.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-25'),
  (1, 64, 'expense', 'Other', NULL, 3870.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-25'),
  (1, 65, 'expense', 'Other', NULL, 3870.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-02-25'),
  (1, 66, 'expense', 'Other', NULL, 20000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-02-25'),
  (1, 67, 'income', NULL, 'Bank interest', 0.09, 'COP', 'INTERESES LIQUIDADOS', '2026-02-25'),
  (1, 68, 'expense', 'Taxes', NULL, 1233.08, 'COP', 'GMF', '2026-02-25'),
  (1, 69, 'income', NULL, 'Transfer from own account', 1681505.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-02-27'),
  (1, 70, 'income', NULL, 'Transfer from own account', 1764275.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-02-27'),
  (1, 71, 'income', NULL, 'Bank interest', 0.94, 'COP', 'INTERESES LIQUIDADOS', '2026-02-27'),
  (1, 72, 'income', NULL, 'Bank interest', 0.94, 'COP', 'INTERESES LIQUIDADOS', '2026-02-27'),
  (2, 1, 'income', NULL, 'Bank interest', 0.94, 'COP', 'INTERESES LIQUIDADOS', '2026-03-02'),
  (2, 2, 'income', NULL, 'Bank interest', 0.94, 'COP', 'INTERESES LIQUIDADOS', '2026-03-03'),
  (2, 3, 'expense', 'Other', NULL, 66200.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-03-04'),
  (2, 4, 'income', NULL, 'Bank interest', 0.94, 'COP', 'INTERESES LIQUIDADOS', '2026-03-04'),
  (2, 5, 'expense', 'Taxes', NULL, 264.80, 'COP', 'GMF', '2026-03-04'),
  (2, 6, 'income', NULL, 'Bank interest', 0.93, 'COP', 'INTERESES LIQUIDADOS', '2026-03-05'),
  (2, 7, 'income', NULL, 'Bank interest', 0.93, 'COP', 'INTERESES LIQUIDADOS', '2026-03-06'),
  (2, 8, 'expense', 'Shopping', NULL, 286500.00, 'COP', 'DOLLARCITY CC ALFAGUA NDI', '2026-03-09'),
  (2, 9, 'expense', 'Shopping', NULL, 12000.00, 'COP', 'DOLLARCITY CC ALFAGUA NDI', '2026-03-09'),
  (2, 10, 'expense', 'Food & Dining', NULL, 46000.00, 'COP', 'BOLD*restaurante chi', '2026-03-09'),
  (2, 11, 'income', NULL, 'Bank interest', 0.93, 'COP', 'INTERESES LIQUIDADOS', '2026-03-09'),
  (2, 12, 'income', NULL, 'Bank interest', 0.93, 'COP', 'INTERESES LIQUIDADOS', '2026-03-09'),
  (2, 13, 'income', NULL, 'Bank interest', 0.93, 'COP', 'INTERESES LIQUIDADOS', '2026-03-09'),
  (2, 14, 'expense', 'Taxes', NULL, 1378.00, 'COP', 'GMF', '2026-03-09'),
  (2, 15, 'expense', 'Other', NULL, 228300.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-03-10'),
  (2, 16, 'expense', 'Other', NULL, 212576.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-03-10'),
  (2, 17, 'expense', 'Other', NULL, 174000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-03-10'),
  (2, 18, 'expense', 'Other', NULL, 374000.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-03-10'),
  (2, 19, 'expense', 'Other', NULL, 54600.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-03-10'),
  (2, 20, 'expense', 'Other', NULL, 150000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-03-10'),
  (2, 21, 'income', NULL, 'Bank interest', 0.83, 'COP', 'INTERESES LIQUIDADOS', '2026-03-10'),
  (2, 22, 'expense', 'Taxes', NULL, 4773.90, 'COP', 'GMF', '2026-03-10'),
  (2, 23, 'income', NULL, 'Bank interest', 0.50, 'COP', 'INTERESES LIQUIDADOS', '2026-03-11'),
  (2, 24, 'expense', 'Utilities', NULL, 33489.00, 'COP', 'MOVISTAR PAGOSEPAYCO TA', '2026-03-12'),
  (2, 25, 'income', NULL, 'Bank interest', 0.50, 'COP', 'INTERESES LIQUIDADOS', '2026-03-12'),
  (2, 26, 'expense', 'Taxes', NULL, 133.96, 'COP', 'GMF', '2026-03-12'),
  (2, 27, 'expense', 'Subscriptions', NULL, 3900.00, 'COP', 'APPLE.COM/BILL RTNO', '2026-03-13'),
  (2, 28, 'expense', 'Subscriptions', NULL, 27000.00, 'COP', 'APPLE.COM/BILL RTNO', '2026-03-13'),
  (2, 29, 'expense', 'Subscriptions', NULL, 3900.00, 'COP', 'APPLE.COM/BILL RTNO', '2026-03-13'),
  (2, 30, 'income', NULL, 'Bank interest', 0.49, 'COP', 'INTERESES LIQUIDADOS', '2026-03-13'),
  (2, 31, 'expense', 'Taxes', NULL, 139.20, 'COP', 'GMF', '2026-03-13'),
  (2, 32, 'income', NULL, 'Bank interest', 0.48, 'COP', 'INTERESES LIQUIDADOS', '2026-03-16'),
  (2, 33, 'income', NULL, 'Bank interest', 0.48, 'COP', 'INTERESES LIQUIDADOS', '2026-03-16'),
  (2, 34, 'income', NULL, 'Bank interest', 0.48, 'COP', 'INTERESES LIQUIDADOS', '2026-03-16'),
  (2, 35, 'income', NULL, 'Bank interest', 0.48, 'COP', 'INTERESES LIQUIDADOS', '2026-03-17'),
  (2, 36, 'income', NULL, 'Bank interest', 0.48, 'COP', 'INTERESES LIQUIDADOS', '2026-03-18'),
  (2, 37, 'income', NULL, 'Bank interest', 0.48, 'COP', 'INTERESES LIQUIDADOS', '2026-03-19'),
  (2, 38, 'income', NULL, 'Bank interest', 0.48, 'COP', 'INTERESES LIQUIDADOS', '2026-03-20'),
  (2, 39, 'expense', 'Other', NULL, 58370.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-03-24'),
  (2, 40, 'expense', 'Food & Dining', NULL, 76900.00, 'COP', 'DOMINOS PIZZA EL DORA DI', '2026-03-24'),
  (2, 41, 'expense', 'Other', NULL, 168000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-03-24'),
  (2, 42, 'expense', 'Other', NULL, 52852.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-03-24'),
  (2, 43, 'expense', 'Groceries', NULL, 233960.00, 'COP', 'TIENDA D1 JAMUNDI NAT DI', '2026-03-24'),
  (2, 44, 'expense', 'Other', NULL, 134100.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-03-24'),
  (2, 45, 'expense', 'Other', NULL, 7095.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-03-24'),
  (2, 46, 'expense', 'Other', NULL, 3911.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-03-24'),
  (2, 47, 'expense', 'Other', NULL, 350000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-03-24'),
  (2, 48, 'income', NULL, 'Bank interest', 0.48, 'COP', 'INTERESES LIQUIDADOS', '2026-03-24'),
  (2, 49, 'income', NULL, 'Bank interest', 0.48, 'COP', 'INTERESES LIQUIDADOS', '2026-03-24'),
  (2, 50, 'income', NULL, 'Bank interest', 0.48, 'COP', 'INTERESES LIQUIDADOS', '2026-03-24'),
  (2, 51, 'income', NULL, 'Bank interest', 0.48, 'COP', 'INTERESES LIQUIDADOS', '2026-03-24'),
  (2, 52, 'expense', 'Taxes', NULL, 4340.75, 'COP', 'GMF', '2026-03-24'),
  (2, 53, 'income', NULL, 'Bank interest', 0.19, 'COP', 'INTERESES LIQUIDADOS', '2026-03-25'),
  (2, 54, 'expense', 'Other', NULL, 60000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-03-26'),
  (2, 55, 'income', NULL, 'Bank interest', 0.19, 'COP', 'INTERESES LIQUIDADOS', '2026-03-26'),
  (2, 56, 'expense', 'Taxes', NULL, 240.00, 'COP', 'GMF', '2026-03-26'),
  (2, 57, 'income', NULL, 'Bank interest', 0.17, 'COP', 'INTERESES LIQUIDADOS', '2026-03-27'),
  (2, 58, 'expense', 'Housing', NULL, 66700.00, 'COP', 'HOMECENTER CALI SUR', '2026-03-30'),
  (2, 59, 'expense', 'Transportation', NULL, 53406.00, 'COP', 'ESTACION DE SERVICIO', '2026-03-30'),
  (2, 60, 'expense', 'Groceries', NULL, 61369.00, 'COP', 'SUPERMERCADO LA GRAN DI', '2026-03-30'),
  (2, 61, 'income', NULL, 'Bank interest', 0.17, 'COP', 'INTERESES LIQUIDADOS', '2026-03-30'),
  (2, 62, 'income', NULL, 'Bank interest', 0.17, 'COP', 'INTERESES LIQUIDADOS', '2026-03-30'),
  (2, 63, 'income', NULL, 'Bank interest', 0.17, 'COP', 'INTERESES LIQUIDADOS', '2026-03-30'),
  (2, 64, 'expense', 'Taxes', NULL, 725.90, 'COP', 'GMF', '2026-03-30'),
  (2, 65, 'income', NULL, 'Transfer from own account', 1764275.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-03-31'),
  (2, 66, 'income', NULL, 'Transfer from own account', 1681505.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-03-31'),
  (2, 67, 'income', NULL, 'Bank interest', 0.12, 'COP', 'INTERESES LIQUIDADOS', '2026-03-31'),
  (2, 68, 'income', NULL, 'Bank interest', 1.06, 'COP', 'INTERESES LIQUIDADOS', '2026-03-31'),
  (3, 1, 'expense', 'Other', NULL, 45000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-06'),
  (3, 2, 'expense', 'Groceries', NULL, 58000.00, 'COP', 'CARNICERIA Y SALS LOS DI', '2026-04-06'),
  (3, 3, 'expense', 'Groceries', NULL, 317930.00, 'COP', 'TIENDA D1 VAL JAMUNDI DI', '2026-04-06'),
  (3, 4, 'expense', 'Food & Dining', NULL, 42500.00, 'COP', 'PANADERIA EL SAMAN NDI', '2026-04-06'),
  (3, 5, 'expense', 'Other', NULL, 330613.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-04-06'),
  (3, 6, 'expense', 'Other', NULL, 404000.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-04-06'),
  (3, 7, 'expense', 'Other', NULL, 150000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-06'),
  (3, 8, 'expense', 'Other', NULL, 174000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-06'),
  (3, 9, 'income', NULL, 'Bank interest', 1.06, 'COP', 'INTERESES LIQUIDADOS', '2026-04-06'),
  (3, 10, 'income', NULL, 'Bank interest', 1.06, 'COP', 'INTERESES LIQUIDADOS', '2026-04-06'),
  (3, 11, 'income', NULL, 'Bank interest', 1.06, 'COP', 'INTERESES LIQUIDADOS', '2026-04-06'),
  (3, 12, 'income', NULL, 'Bank interest', 1.06, 'COP', 'INTERESES LIQUIDADOS', '2026-04-06'),
  (3, 13, 'income', NULL, 'Bank interest', 1.06, 'COP', 'INTERESES LIQUIDADOS', '2026-04-06'),
  (3, 14, 'expense', 'Taxes', NULL, 6088.17, 'COP', 'GMF', '2026-04-06'),
  (3, 15, 'income', NULL, 'Bank interest', 0.65, 'COP', 'INTERESES LIQUIDADOS', '2026-04-07'),
  (3, 16, 'expense', 'Other', NULL, 270700.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-04-08'),
  (3, 17, 'income', NULL, 'Bank interest', 0.65, 'COP', 'INTERESES LIQUIDADOS', '2026-04-08'),
  (3, 18, 'expense', 'Taxes', NULL, 1082.80, 'COP', 'GMF', '2026-04-08'),
  (3, 19, 'income', NULL, 'Bank interest', 0.57, 'COP', 'INTERESES LIQUIDADOS', '2026-04-09'),
  (3, 20, 'income', NULL, 'Bank interest', 0.57, 'COP', 'INTERESES LIQUIDADOS', '2026-04-10'),
  (3, 21, 'expense', 'Other', NULL, 420000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-13'),
  (3, 22, 'expense', 'Other', NULL, 69000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-13'),
  (3, 23, 'expense', 'Groceries', NULL, 149030.00, 'COP', 'TIENDA D1 VAL JAMUNDI DI', '2026-04-13'),
  (3, 24, 'expense', 'Food & Dining', NULL, 28000.00, 'COP', 'PANADERIA EL SAMAN NDI', '2026-04-13'),
  (3, 25, 'expense', 'Groceries', NULL, 62870.00, 'COP', 'TIENDAS ARA DI', '2026-04-13'),
  (3, 26, 'expense', 'Groceries', NULL, 29990.00, 'COP', 'TIENDAS ARA DI', '2026-04-13'),
  (3, 27, 'expense', 'Utilities', NULL, 33489.00, 'COP', 'MOVISTAR PAGOSEPAYCO TA', '2026-04-13'),
  (3, 28, 'expense', 'Subscriptions', NULL, 27000.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-04-13'),
  (3, 29, 'expense', 'Subscriptions', NULL, 3900.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-04-13'),
  (3, 30, 'expense', 'Subscriptions', NULL, 3900.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-04-13'),
  (3, 31, 'income', NULL, 'ACH transfer received', 1667420.00, 'COP', 'PAGO TERCERO RECIBIDO DESDE ACH', '2026-04-13'),
  (3, 32, 'income', NULL, 'Bank interest', 0.57, 'COP', 'INTERESES LIQUIDADOS', '2026-04-13'),
  (3, 33, 'income', NULL, 'Bank interest', 0.57, 'COP', 'INTERESES LIQUIDADOS', '2026-04-13'),
  (3, 34, 'income', NULL, 'Bank interest', 0.57, 'COP', 'INTERESES LIQUIDADOS', '2026-04-13'),
  (3, 35, 'expense', 'Taxes', NULL, 3308.72, 'COP', 'GMF', '2026-04-13'),
  (3, 36, 'income', NULL, 'Bank interest', 0.80, 'COP', 'INTERESES LIQUIDADOS', '2026-04-14'),
  (3, 37, 'expense', 'Other', NULL, 700000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-15'),
  (3, 38, 'income', NULL, 'Bank interest', 0.80, 'COP', 'INTERESES LIQUIDADOS', '2026-04-15'),
  (3, 39, 'expense', 'Taxes', NULL, 2800.00, 'COP', 'GMF', '2026-04-15'),
  (3, 40, 'expense', 'Food & Dining', NULL, 46000.00, 'COP', 'BOLD*ELSA RICURAS RE NDI', '2026-04-16'),
  (3, 41, 'expense', 'Other', NULL, 450000.00, 'COP', 'COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO', '2026-04-16'),
  (3, 42, 'expense', 'Groceries', NULL, 11600.00, 'COP', 'EXITO WOW JAMUNDI NDI', '2026-04-16'),
  (3, 43, 'expense', 'Food & Dining', NULL, 50000.00, 'COP', 'EL ANTOJO DE JAMUNDA NDI', '2026-04-16'),
  (3, 44, 'expense', 'Groceries', NULL, 6050.00, 'COP', 'SUPERMERCADOS GALERIA NDI', '2026-04-16'),
  (3, 45, 'income', NULL, 'Bank interest', 0.61, 'COP', 'INTERESES LIQUIDADOS', '2026-04-16'),
  (3, 46, 'expense', 'Taxes', NULL, 2254.60, 'COP', 'GMF', '2026-04-16'),
  (3, 47, 'expense', 'Groceries', NULL, 33420.00, 'COP', 'TIENDA D1 JAMUNDI NAT DI', '2026-04-17'),
  (3, 48, 'income', NULL, 'Bank interest', 0.45, 'COP', 'INTERESES LIQUIDADOS', '2026-04-17'),
  (3, 49, 'expense', 'Taxes', NULL, 133.68, 'COP', 'GMF', '2026-04-17'),
  (3, 50, 'expense', 'Other', NULL, 170000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-20'),
  (3, 51, 'expense', 'Other', NULL, 37000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-20'),
  (3, 52, 'expense', 'Other', NULL, 33000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-20'),
  (3, 53, 'income', NULL, 'Bank interest', 0.44, 'COP', 'INTERESES LIQUIDADOS', '2026-04-20'),
  (3, 54, 'income', NULL, 'Bank interest', 0.44, 'COP', 'INTERESES LIQUIDADOS', '2026-04-20'),
  (3, 55, 'income', NULL, 'Bank interest', 0.44, 'COP', 'INTERESES LIQUIDADOS', '2026-04-20'),
  (3, 56, 'expense', 'Taxes', NULL, 960.00, 'COP', 'GMF', '2026-04-20'),
  (3, 57, 'expense', 'Other', NULL, 251000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-21'),
  (3, 58, 'expense', 'Other', NULL, 15000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-21'),
  (3, 59, 'income', NULL, 'Bank interest', 0.38, 'COP', 'INTERESES LIQUIDADOS', '2026-04-21'),
  (3, 60, 'expense', 'Taxes', NULL, 1064.00, 'COP', 'GMF', '2026-04-21'),
  (3, 61, 'expense', 'Other', NULL, 30000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-22'),
  (3, 62, 'income', NULL, 'Bank interest', 0.30, 'COP', 'INTERESES LIQUIDADOS', '2026-04-22'),
  (3, 63, 'expense', 'Taxes', NULL, 120.00, 'COP', 'GMF', '2026-04-22'),
  (3, 64, 'expense', 'Other', NULL, 8000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-23'),
  (3, 65, 'income', NULL, 'Bank interest', 0.30, 'COP', 'INTERESES LIQUIDADOS', '2026-04-23'),
  (3, 66, 'expense', 'Taxes', NULL, 32.00, 'COP', 'GMF', '2026-04-23'),
  (3, 67, 'expense', 'Other', NULL, 380000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-24'),
  (3, 68, 'income', NULL, 'Bank interest', 0.29, 'COP', 'INTERESES LIQUIDADOS', '2026-04-24'),
  (3, 69, 'expense', 'Taxes', NULL, 1520.00, 'COP', 'GMF', '2026-04-24'),
  (3, 70, 'expense', 'Other', NULL, 72000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-27'),
  (3, 71, 'expense', 'Transportation', NULL, 78789.00, 'COP', 'EDS JAMUNDI A', '2026-04-27'),
  (3, 72, 'expense', 'Food & Dining', NULL, 10000.00, 'COP', 'EL ANTOJO PANAMERICAN NDI', '2026-04-27'),
  (3, 73, 'expense', 'Food & Dining', NULL, 58000.00, 'COP', 'BOLD*restaurante chi', '2026-04-27'),
  (3, 74, 'income', NULL, 'Bank interest', 0.19, 'COP', 'INTERESES LIQUIDADOS', '2026-04-27'),
  (3, 75, 'income', NULL, 'Bank interest', 0.19, 'COP', 'INTERESES LIQUIDADOS', '2026-04-27'),
  (3, 76, 'income', NULL, 'Bank interest', 0.19, 'COP', 'INTERESES LIQUIDADOS', '2026-04-27'),
  (3, 77, 'expense', 'Taxes', NULL, 875.16, 'COP', 'GMF', '2026-04-27'),
  (3, 78, 'expense', 'Other', NULL, 15000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-28'),
  (3, 79, 'expense', 'Other', NULL, 15000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-28'),
  (3, 80, 'expense', 'Other', NULL, 65000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-28'),
  (3, 81, 'expense', 'Groceries', NULL, 186873.00, 'COP', 'TIENDAS ARA DI', '2026-04-28'),
  (3, 82, 'income', NULL, 'Bank interest', 0.13, 'COP', 'INTERESES LIQUIDADOS', '2026-04-28'),
  (3, 83, 'expense', 'Taxes', NULL, 1127.49, 'COP', 'GMF', '2026-04-28'),
  (3, 84, 'expense', 'Other', NULL, 45000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-29'),
  (3, 85, 'income', NULL, 'Bank interest', 0.05, 'COP', 'INTERESES LIQUIDADOS', '2026-04-29'),
  (3, 86, 'expense', 'Taxes', NULL, 180.00, 'COP', 'GMF', '2026-04-29'),
  (3, 87, 'income', NULL, 'Transfer from own account', 1764275.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-04-30'),
  (3, 88, 'income', NULL, 'Transfer from own account', 1681505.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-04-30'),
  (3, 89, 'expense', 'Other', NULL, 100000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-04-30'),
  (3, 90, 'income', NULL, 'Bank interest', 0.04, 'COP', 'INTERESES LIQUIDADOS', '2026-04-30'),
  (3, 91, 'income', NULL, 'Bank interest', 0.96, 'COP', 'INTERESES LIQUIDADOS', '2026-04-30'),
  (3, 92, 'expense', 'Taxes', NULL, 400.00, 'COP', 'GMF', '2026-04-30'),
  (4, 1, 'expense', 'Other', NULL, 55000.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-05-04'),
  (4, 2, 'expense', 'Other', NULL, 3949.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-05-04'),
  (4, 3, 'expense', 'Other', NULL, 3949.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-05-04'),
  (4, 4, 'expense', 'Other', NULL, 70000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-04'),
  (4, 5, 'expense', 'Other', NULL, 120000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-04'),
  (4, 6, 'expense', 'Other', NULL, 85000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-04'),
  (4, 7, 'income', NULL, 'Bank interest', 0.96, 'COP', 'INTERESES LIQUIDADOS', '2026-05-04'),
  (4, 8, 'income', NULL, 'Bank interest', 0.96, 'COP', 'INTERESES LIQUIDADOS', '2026-05-04'),
  (4, 9, 'income', NULL, 'Bank interest', 0.96, 'COP', 'INTERESES LIQUIDADOS', '2026-05-04'),
  (4, 10, 'expense', 'Taxes', NULL, 1351.60, 'COP', 'GMF', '2026-05-04'),
  (4, 11, 'income', NULL, 'Bank interest', 0.86, 'COP', 'INTERESES LIQUIDADOS', '2026-05-05'),
  (4, 12, 'income', NULL, 'ACH transfer received', 1752458.00, 'COP', 'PAGO TERCERO RECIBIDO DESDE ACH', '2026-05-06'),
  (4, 13, 'income', NULL, 'Bank interest', 0.86, 'COP', 'INTERESES LIQUIDADOS', '2026-05-06'),
  (4, 14, 'income', NULL, 'Bank interest', 1.34, 'COP', 'INTERESES LIQUIDADOS', '2026-05-07'),
  (4, 15, 'income', NULL, 'Bank interest', 1.34, 'COP', 'INTERESES LIQUIDADOS', '2026-05-08'),
  (4, 16, 'expense', 'Other', NULL, 21630.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-05-11'),
  (4, 17, 'expense', 'Other', NULL, 44000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-11'),
  (4, 18, 'expense', 'Shopping', NULL, 164000.00, 'COP', 'DOLLARCITY LA 9', '2026-05-11'),
  (4, 19, 'expense', 'Other', NULL, 275000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-11'),
  (4, 20, 'expense', 'Groceries', NULL, 318740.00, 'COP', 'TIENDAS ARA DI', '2026-05-11'),
  (4, 21, 'expense', 'Groceries', NULL, 81400.00, 'COP', 'TIENDA D1 VAL JAMUNDI DI', '2026-05-11'),
  (4, 22, 'expense', 'Other', NULL, 65000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-11'),
  (4, 23, 'expense', 'Other', NULL, 509000.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-05-11'),
  (4, 24, 'expense', 'Other', NULL, 313900.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-05-11'),
  (4, 25, 'expense', 'Other', NULL, 277254.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-05-11'),
  (4, 26, 'expense', 'Other', NULL, 139220.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-05-11'),
  (4, 27, 'expense', 'Other', NULL, 174000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-11'),
  (4, 28, 'expense', 'Other', NULL, 120000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-11'),
  (4, 29, 'expense', 'Other', NULL, 107550.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-05-11'),
  (4, 30, 'income', NULL, 'Bank interest', 1.34, 'COP', 'INTERESES LIQUIDADOS', '2026-05-11'),
  (4, 31, 'income', NULL, 'Bank interest', 1.34, 'COP', 'INTERESES LIQUIDADOS', '2026-05-11'),
  (4, 32, 'income', NULL, 'Bank interest', 1.34, 'COP', 'INTERESES LIQUIDADOS', '2026-05-11'),
  (4, 33, 'expense', 'Taxes', NULL, 10442.78, 'COP', 'GMF', '2026-05-11'),
  (4, 34, 'income', NULL, 'Bank interest', 0.62, 'COP', 'INTERESES LIQUIDADOS', '2026-05-12'),
  (4, 35, 'expense', 'Other', NULL, 24000.00, 'COP', 'COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO', '2026-05-13'),
  (4, 36, 'expense', 'Subscriptions', NULL, 27000.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-05-13'),
  (4, 37, 'expense', 'Subscriptions', NULL, 3900.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-05-13'),
  (4, 38, 'expense', 'Subscriptions', NULL, 3900.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-05-13'),
  (4, 39, 'expense', 'Groceries', NULL, 58000.00, 'COP', 'CARNICERIA Y SALS LOS DI', '2026-05-13'),
  (4, 40, 'expense', 'Food & Dining', NULL, 30000.00, 'COP', 'PANADERIA EL SAMAN NDI', '2026-05-13'),
  (4, 41, 'expense', 'Other', NULL, 67050.00, 'COP', 'COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO', '2026-05-13'),
  (4, 42, 'expense', 'Groceries', NULL, 16400.00, 'COP', 'SUPER LA GRAN COLOMBI DI', '2026-05-13'),
  (4, 43, 'expense', 'Groceries', NULL, 99780.00, 'COP', 'TIENDAS ARA DI', '2026-05-13'),
  (4, 44, 'expense', 'Groceries', NULL, 12700.00, 'COP', 'TIENDA D1 JAMUNDI NAT DI', '2026-05-13'),
  (4, 45, 'expense', 'Groceries', NULL, 4450.00, 'COP', 'TIENDA D1 JAMUNDI NAT DI', '2026-05-13'),
  (4, 46, 'income', NULL, 'Bank interest', 0.62, 'COP', 'INTERESES LIQUIDADOS', '2026-05-13'),
  (4, 47, 'expense', 'Taxes', NULL, 1388.72, 'COP', 'GMF', '2026-05-13'),
  (4, 48, 'expense', 'Utilities', NULL, 33489.00, 'COP', 'MOVISTAR PAGOSEPAYCO TA', '2026-05-14'),
  (4, 49, 'income', NULL, 'Bank interest', 0.53, 'COP', 'INTERESES LIQUIDADOS', '2026-05-14'),
  (4, 50, 'expense', 'Taxes', NULL, 133.96, 'COP', 'GMF', '2026-05-14'),
  (4, 51, 'expense', 'Other', NULL, 8000.00, 'COP', 'COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO', '2026-05-15'),
  (4, 52, 'expense', 'Other', NULL, 85000.00, 'COP', 'COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO', '2026-05-15'),
  (4, 53, 'income', NULL, 'Bank interest', 0.52, 'COP', 'INTERESES LIQUIDADOS', '2026-05-15'),
  (4, 54, 'expense', 'Taxes', NULL, 372.00, 'COP', 'GMF', '2026-05-15'),
  (4, 55, 'expense', 'Housing', NULL, 150900.00, 'COP', 'IKEA CALI', '2026-05-19'),
  (4, 56, 'expense', 'Housing', NULL, 1900.00, 'COP', 'IKEA CALI', '2026-05-19'),
  (4, 57, 'expense', 'Housing', NULL, 5700.00, 'COP', 'IKEA CALI', '2026-05-19'),
  (4, 58, 'expense', 'Housing', NULL, 464805.00, 'COP', 'IKEA CALI', '2026-05-19'),
  (4, 59, 'expense', 'Other', NULL, 130000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-19'),
  (4, 60, 'expense', 'Personal Care', NULL, 32000.00, 'COP', 'COSMETIC SHOP MALL PL', '2026-05-19'),
  (4, 61, 'expense', 'Food & Dining', NULL, 68700.00, 'COP', 'FOOD GROUP COLOMBIA', '2026-05-19'),
  (4, 62, 'expense', 'Healthcare', NULL, 25740.00, 'COP', 'DROG CRUZ VERDE ALFAG DI', '2026-05-19'),
  (4, 63, 'expense', 'Groceries', NULL, 7437.00, 'COP', 'EXITO WOW JAMUNDI NDI', '2026-05-19'),
  (4, 64, 'expense', 'Groceries', NULL, 20390.00, 'COP', 'TIENDAS ARA DI', '2026-05-19'),
  (4, 65, 'expense', 'Other', NULL, 30000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-19'),
  (4, 66, 'expense', 'Other', NULL, 800000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-19'),
  (4, 67, 'expense', 'Other', NULL, 22000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-19'),
  (4, 68, 'expense', 'Other', NULL, 18000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-19'),
  (4, 69, 'income', NULL, 'Bank interest', 0.49, 'COP', 'INTERESES LIQUIDADOS', '2026-05-19'),
  (4, 70, 'income', NULL, 'Bank interest', 0.49, 'COP', 'INTERESES LIQUIDADOS', '2026-05-19'),
  (4, 71, 'income', NULL, 'Bank interest', 0.49, 'COP', 'INTERESES LIQUIDADOS', '2026-05-19'),
  (4, 72, 'income', NULL, 'Bank interest', 0.49, 'COP', 'INTERESES LIQUIDADOS', '2026-05-19'),
  (4, 73, 'expense', 'Taxes', NULL, 7110.29, 'COP', 'GMF', '2026-05-19'),
  (4, 74, 'income', NULL, 'Bank transfer received', 850000.00, 'COP', 'BRE-B RECIBIDA OTROS BANCOS', '2026-05-20'),
  (4, 75, 'income', NULL, 'Bank interest', 0.01, 'COP', 'INTERESES LIQUIDADOS', '2026-05-20'),
  (4, 76, 'expense', 'Other', NULL, 17000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-21'),
  (4, 77, 'income', NULL, 'Bank interest', 0.24, 'COP', 'INTERESES LIQUIDADOS', '2026-05-21'),
  (4, 78, 'expense', 'Taxes', NULL, 68.00, 'COP', 'GMF', '2026-05-21'),
  (4, 79, 'expense', 'Other', NULL, 70000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-22'),
  (4, 80, 'expense', 'Other', NULL, 18000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-22'),
  (4, 81, 'income', NULL, 'Other credit', 94960.00, 'COP', 'ABONO POR TRANSACCIONES VARIAS', '2026-05-22'),
  (4, 82, 'income', NULL, 'Bank interest', 0.23, 'COP', 'INTERESES LIQUIDADOS', '2026-05-22'),
  (4, 83, 'expense', 'Taxes', NULL, 352.00, 'COP', 'GMF', '2026-05-22'),
  (4, 84, 'expense', 'Other', NULL, 181000.00, 'COP', 'COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO', '2026-05-25'),
  (4, 85, 'expense', 'Other', NULL, 42000.00, 'COP', 'COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO', '2026-05-25'),
  (4, 86, 'expense', 'Other', NULL, 30000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-25'),
  (4, 87, 'expense', 'Other', NULL, 20000.00, 'COP', 'COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO', '2026-05-25'),
  (4, 88, 'expense', 'Other', NULL, 10000.00, 'COP', 'COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO', '2026-05-25'),
  (4, 89, 'expense', 'Other', NULL, 200000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-25'),
  (4, 90, 'income', NULL, 'ACH transfer received', 1752458.00, 'COP', 'PAGO TERCERO RECIBIDO DESDE ACH', '2026-05-25'),
  (4, 91, 'income', NULL, 'Bank interest', 0.24, 'COP', 'INTERESES LIQUIDADOS', '2026-05-25'),
  (4, 92, 'income', NULL, 'Bank interest', 0.24, 'COP', 'INTERESES LIQUIDADOS', '2026-05-25'),
  (4, 93, 'income', NULL, 'Bank interest', 0.24, 'COP', 'INTERESES LIQUIDADOS', '2026-05-25'),
  (4, 94, 'expense', 'Taxes', NULL, 1932.00, 'COP', 'GMF', '2026-05-25'),
  (4, 95, 'income', NULL, 'Bank interest', 0.58, 'COP', 'INTERESES LIQUIDADOS', '2026-05-26'),
  (4, 96, 'expense', 'Other', NULL, 50000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-27'),
  (4, 97, 'income', NULL, 'Bank interest', 0.58, 'COP', 'INTERESES LIQUIDADOS', '2026-05-27'),
  (4, 98, 'expense', 'Taxes', NULL, 200.00, 'COP', 'GMF', '2026-05-27'),
  (4, 99, 'income', NULL, 'Bank interest', 0.57, 'COP', 'INTERESES LIQUIDADOS', '2026-05-28'),
  (4, 100, 'income', NULL, 'Transfer from own account', 1681505.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-05-29'),
  (4, 101, 'income', NULL, 'Transfer from own account', 1764275.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-05-29'),
  (4, 102, 'expense', 'Other', NULL, 26000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-29'),
  (4, 103, 'expense', 'Other', NULL, 30000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-05-29'),
  (4, 104, 'income', NULL, 'Bank interest', 0.57, 'COP', 'INTERESES LIQUIDADOS', '2026-05-29'),
  (4, 105, 'income', NULL, 'Bank interest', 1.50, 'COP', 'INTERESES LIQUIDADOS', '2026-05-29'),
  (4, 106, 'income', NULL, 'Bank interest', 1.50, 'COP', 'INTERESES LIQUIDADOS', '2026-05-29'),
  (4, 107, 'income', NULL, 'Bank interest', 1.50, 'COP', 'INTERESES LIQUIDADOS', '2026-05-29'),
  (4, 108, 'expense', 'Taxes', NULL, 224.00, 'COP', 'GMF', '2026-05-29'),
  (5, 1, 'expense', 'Other', NULL, 26000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-01'),
  (5, 2, 'expense', 'Transportation', NULL, 39911.00, 'COP', 'ESTACION DE SERVICIO', '2026-06-01'),
  (5, 3, 'expense', 'Other', NULL, 152000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-01'),
  (5, 4, 'expense', 'Taxes', NULL, 871.64, 'COP', 'GMF', '2026-06-01'),
  (5, 5, 'income', NULL, 'Bank interest', 1.44, 'COP', 'INTERESES LIQUIDADOS', '2026-06-02'),
  (5, 6, 'income', NULL, 'Bank interest', 1.44, 'COP', 'INTERESES LIQUIDADOS', '2026-06-03'),
  (5, 7, 'income', NULL, 'Bank interest', 1.44, 'COP', 'INTERESES LIQUIDADOS', '2026-06-04'),
  (5, 8, 'expense', 'Other', NULL, 149000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-05'),
  (5, 9, 'expense', 'Groceries', NULL, 26240.00, 'COP', 'TIENDA D1 VAL JAMUNDI DI', '2026-06-05'),
  (5, 10, 'expense', 'Groceries', NULL, 114150.00, 'COP', 'TIENDA D1 VAL JAMUNDI DI', '2026-06-05'),
  (5, 11, 'income', NULL, 'Bank interest', 1.44, 'COP', 'INTERESES LIQUIDADOS', '2026-06-05'),
  (5, 12, 'expense', 'Taxes', NULL, 1157.56, 'COP', 'GMF', '2026-06-05'),
  (5, 13, 'expense', 'Other', NULL, 50000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-09'),
  (5, 14, 'income', NULL, 'ACH transfer received', 1752458.00, 'COP', 'PAGO TERCERO RECIBIDO DESDE ACH', '2026-06-09'),
  (5, 15, 'expense', 'Other', NULL, 28000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-09'),
  (5, 16, 'expense', 'Other', NULL, 20000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-09'),
  (5, 17, 'expense', 'Other', NULL, 174000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-09'),
  (5, 18, 'income', NULL, 'Bank interest', 1.36, 'COP', 'INTERESES LIQUIDADOS', '2026-06-09'),
  (5, 19, 'income', NULL, 'Bank interest', 1.36, 'COP', 'INTERESES LIQUIDADOS', '2026-06-09'),
  (5, 20, 'income', NULL, 'Bank interest', 1.36, 'COP', 'INTERESES LIQUIDADOS', '2026-06-09'),
  (5, 21, 'income', NULL, 'Bank interest', 1.36, 'COP', 'INTERESES LIQUIDADOS', '2026-06-09'),
  (5, 22, 'expense', 'Taxes', NULL, 1088.00, 'COP', 'GMF', '2026-06-09'),
  (5, 23, 'expense', 'Other', NULL, 1059154.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-10'),
  (5, 24, 'expense', 'Other', NULL, 21770.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-10'),
  (5, 25, 'income', NULL, 'Bank interest', 1.76, 'COP', 'INTERESES LIQUIDADOS', '2026-06-10'),
  (5, 26, 'expense', 'Taxes', NULL, 4323.70, 'COP', 'GMF', '2026-06-10'),
  (5, 27, 'income', NULL, 'Bank interest', 1.47, 'COP', 'INTERESES LIQUIDADOS', '2026-06-11'),
  (5, 28, 'expense', 'Other', NULL, 200000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-12'),
  (5, 29, 'expense', 'Utilities', NULL, 33489.00, 'COP', 'MOVISTAR PAGOSEPAYCO TA', '2026-06-12'),
  (5, 30, 'income', NULL, 'Bank interest', 1.47, 'COP', 'INTERESES LIQUIDADOS', '2026-06-12'),
  (5, 31, 'expense', 'Taxes', NULL, 933.96, 'COP', 'GMF', '2026-06-12'),
  (5, 32, 'expense', 'Subscriptions', NULL, 27000.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-06-16'),
  (5, 33, 'expense', 'Subscriptions', NULL, 3900.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-06-16'),
  (5, 34, 'expense', 'Subscriptions', NULL, 3900.00, 'COP', 'APPLE.COM/BILL RTINO', '2026-06-16'),
  (5, 35, 'expense', 'Other', NULL, 68000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-16'),
  (5, 36, 'income', NULL, 'Bank interest', 1.40, 'COP', 'INTERESES LIQUIDADOS', '2026-06-16'),
  (5, 37, 'income', NULL, 'Bank interest', 1.40, 'COP', 'INTERESES LIQUIDADOS', '2026-06-16'),
  (5, 38, 'income', NULL, 'Bank interest', 1.40, 'COP', 'INTERESES LIQUIDADOS', '2026-06-16'),
  (5, 39, 'income', NULL, 'Bank interest', 1.40, 'COP', 'INTERESES LIQUIDADOS', '2026-06-16'),
  (5, 40, 'expense', 'Taxes', NULL, 411.20, 'COP', 'GMF', '2026-06-16'),
  (5, 41, 'expense', 'Other', NULL, 8000.00, 'COP', 'COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO', '2026-06-17'),
  (5, 42, 'expense', 'Other', NULL, 65100.00, 'COP', 'COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO', '2026-06-17'),
  (5, 43, 'expense', 'Other', NULL, 17500.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-17'),
  (5, 44, 'expense', 'Personal Care', NULL, 29500.00, 'COP', 'SURTIBELLEZA LORENA DI', '2026-06-17'),
  (5, 45, 'expense', 'Personal Care', NULL, 22500.00, 'COP', 'SURTIBELLEZA LORENA DI', '2026-06-17'),
  (5, 46, 'expense', 'Groceries', NULL, 265130.00, 'COP', 'TIENDA D1 VAL JAMUNDI DI', '2026-06-17'),
  (5, 47, 'expense', 'Groceries', NULL, 51940.00, 'COP', 'TIENDA D1 VAL JAMUNDI DI', '2026-06-17'),
  (5, 48, 'income', NULL, 'Bank interest', 1.37, 'COP', 'INTERESES LIQUIDADOS', '2026-06-17'),
  (5, 49, 'expense', 'Taxes', NULL, 1838.68, 'COP', 'GMF', '2026-06-17'),
  (5, 50, 'expense', 'Other', NULL, 320000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-18'),
  (5, 51, 'income', NULL, 'Bank interest', 1.25, 'COP', 'INTERESES LIQUIDADOS', '2026-06-18'),
  (5, 52, 'expense', 'Taxes', NULL, 1280.00, 'COP', 'GMF', '2026-06-18'),
  (5, 53, 'income', NULL, 'Bank interest', 1.16, 'COP', 'INTERESES LIQUIDADOS', '2026-06-19'),
  (5, 54, 'expense', 'Transportation', NULL, 62900.00, 'COP', 'BOLD SA*SERVITEC TA D C', '2026-06-22'),
  (5, 55, 'expense', 'Food & Dining', NULL, 22500.00, 'COP', 'PANADERIA EL SAMAN NDI', '2026-06-22'),
  (5, 56, 'expense', 'Transportation', NULL, 90344.00, 'COP', 'OPECOM EDS LA AUTOPIS', '2026-06-22'),
  (5, 57, 'expense', 'Food & Dining', NULL, 67000.00, 'COP', 'BOLD SA*RESTAURA TA D C', '2026-06-22'),
  (5, 58, 'expense', 'Groceries', NULL, 64216.00, 'COP', 'TIENDAS ARA DI', '2026-06-22'),
  (5, 59, 'expense', 'Other', NULL, 11184.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-06-22'),
  (5, 60, 'expense', 'Other', NULL, 11184.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-06-22'),
  (5, 61, 'expense', 'Other', NULL, 22000.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-06-22'),
  (5, 62, 'expense', 'Other', NULL, 251997.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-06-22'),
  (5, 63, 'expense', 'Other', NULL, 53944.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-06-22'),
  (5, 64, 'expense', 'Other', NULL, 70660.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-06-22'),
  (5, 65, 'expense', 'Other', NULL, 50000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-22'),
  (5, 66, 'income', NULL, 'Bank interest', 1.16, 'COP', 'INTERESES LIQUIDADOS', '2026-06-22'),
  (5, 67, 'income', NULL, 'Bank interest', 1.16, 'COP', 'INTERESES LIQUIDADOS', '2026-06-22'),
  (5, 68, 'income', NULL, 'Bank interest', 1.16, 'COP', 'INTERESES LIQUIDADOS', '2026-06-22'),
  (5, 69, 'expense', 'Taxes', NULL, 3111.73, 'COP', 'GMF', '2026-06-22'),
  (5, 70, 'expense', 'Other', NULL, 50000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-23'),
  (5, 71, 'income', NULL, 'Bank interest', 0.95, 'COP', 'INTERESES LIQUIDADOS', '2026-06-23'),
  (5, 72, 'expense', 'Taxes', NULL, 200.00, 'COP', 'GMF', '2026-06-23'),
  (5, 73, 'income', NULL, 'Bank interest', 0.93, 'COP', 'INTERESES LIQUIDADOS', '2026-06-24'),
  (5, 74, 'expense', 'Other', NULL, 1634000.00, 'COP', 'RECAUDO/PAGO SERVICIOS ELECT', '2026-06-25'),
  (5, 75, 'income', NULL, 'Bank transfer received', 450000.00, 'COP', 'BRE-B RECIBIDA OTROS BANCOS', '2026-06-25'),
  (5, 76, 'expense', 'Other', NULL, 366000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-25'),
  (5, 77, 'income', NULL, 'Bank interest', 0.93, 'COP', 'INTERESES LIQUIDADOS', '2026-06-25'),
  (5, 78, 'expense', 'Taxes', NULL, 8000.00, 'COP', 'GMF', '2026-06-25'),
  (5, 79, 'income', NULL, 'Bank interest', 0.50, 'COP', 'INTERESES LIQUIDADOS', '2026-06-26'),
  (5, 80, 'expense', 'Other', NULL, 200000.00, 'COP', 'BRE-B ENVIADA OTROS BANCOS', '2026-06-30'),
  (5, 81, 'expense', 'Food & Dining', NULL, 15000.00, 'COP', 'EL ANTOJO DE JAMUNDI NDI', '2026-06-30'),
  (5, 82, 'expense', 'Groceries', NULL, 21710.00, 'COP', 'SUPER LA GRAN COLOMBI DI', '2026-06-30'),
  (5, 83, 'expense', 'Groceries', NULL, 65600.00, 'COP', 'MERCASTILLO EXPRESS DI', '2026-06-30'),
  (5, 84, 'expense', 'Groceries', NULL, 28150.00, 'COP', 'SC CIUDAD COUNTRY GO', '2026-06-30'),
  (5, 85, 'expense', 'Healthcare', NULL, 44800.00, 'COP', 'FD SAN JORGE COUNTRYM NDI', '2026-06-30'),
  (5, 86, 'expense', 'Groceries', NULL, 125850.00, 'COP', 'TIENDA D1 VAL JAMUNDI DI', '2026-06-30'),
  (5, 87, 'expense', 'Transportation', NULL, 3300.00, 'COP', 'CITY PARKING', '2026-06-30'),
  (5, 88, 'income', NULL, 'Transfer from own account', 3432410.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-06-30'),
  (5, 89, 'income', NULL, 'Transfer from own account', 3769150.00, 'COP', 'PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA', '2026-06-30'),
  (5, 90, 'income', NULL, 'Bank interest', 0.50, 'COP', 'INTERESES LIQUIDADOS', '2026-06-30'),
  (5, 91, 'income', NULL, 'Bank interest', 0.50, 'COP', 'INTERESES LIQUIDADOS', '2026-06-30'),
  (5, 92, 'income', NULL, 'Bank interest', 0.50, 'COP', 'INTERESES LIQUIDADOS', '2026-06-30'),
  (5, 93, 'income', NULL, 'Bank interest', 0.50, 'COP', 'INTERESES LIQUIDADOS', '2026-06-30'),
  (5, 94, 'income', NULL, 'Bank interest', 2.34, 'COP', 'INTERESES LIQUIDADOS', '2026-06-30'),
  (5, 95, 'expense', 'Taxes', NULL, 2017.64, 'COP', 'GMF', '2026-06-30');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM tmp_occidente_expected expected
    LEFT JOIN (
      SELECT statement_index,
        COUNT(*) FILTER (WHERE row_type = 'expense') AS debit_count,
        COALESCE(SUM(amount) FILTER (WHERE row_type = 'expense'), 0) AS debit_total,
        COUNT(*) FILTER (WHERE row_type = 'income') AS credit_count,
        COALESCE(SUM(amount) FILTER (WHERE row_type = 'income'), 0) AS credit_total
      FROM tmp_occidente_import
      GROUP BY statement_index
    ) staged USING (statement_index)
    WHERE staged.debit_count IS DISTINCT FROM expected.debit_count
       OR staged.debit_total IS DISTINCT FROM expected.debit_total
       OR staged.credit_count IS DISTINCT FROM expected.credit_count
       OR staged.credit_total IS DISTINCT FROM expected.credit_total
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'Banco de Occidente staged rows do not reconcile to statement summaries.';
  END IF;
END $$;

DO $$
DECLARE
  v_uid UUID := (SELECT user_id FROM tmp_occidente_context LIMIT 1);
  v_name TEXT;
  v_icon TEXT;
  v_color TEXT;
  v_is_default BOOLEAN;
BEGIN
  FOR v_name, v_icon, v_color, v_is_default IN
    SELECT * FROM (VALUES
      ('Food & Dining', 'utensils', '#ef4444', true),
      ('Groceries', 'shopping-cart', '#22c55e', true),
      ('Healthcare', 'heart-pulse', '#ec4899', true),
      ('Housing', 'home', '#eab308', true),
      ('Other', 'more-horizontal', '#64748b', true),
      ('Personal Care', 'sparkles', '#c026d3', false),
      ('Shopping', 'shopping-bag', '#8b5cf6', true),
      ('Subscriptions', 'repeat', '#f43f5e', true),
      ('Taxes', 'landmark', '#b91c1c', false),
      ('Transportation', 'car', '#f97316', true),
      ('Utilities', 'zap', '#84cc16', true)
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

CREATE TEMP TABLE tmp_occidente_category_lookup AS
WITH ctx AS (SELECT user_id FROM tmp_occidente_context LIMIT 1)
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
  ('Groceries'),
  ('Healthcare'),
  ('Housing'),
  ('Other'),
  ('Personal Care'),
  ('Shopping'),
  ('Subscriptions'),
  ('Taxes'),
  ('Transportation'),
  ('Utilities')
) AS needed(name);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM tmp_occidente_category_lookup WHERE category_id IS NULL) THEN
    RAISE EXCEPTION USING MESSAGE = 'Category lookup failed for Banco de Occidente import.';
  END IF;
END $$;

WITH ctx AS (SELECT user_id FROM tmp_occidente_context LIMIT 1),
ranked_staged AS (
  SELECT staged.*, lookup.category_id,
    ROW_NUMBER() OVER (
      PARTITION BY lookup.category_id, staged.amount, staged.currency, staged.description, staged.date
      ORDER BY staged.statement_index, staged.statement_row
    ) AS occurrence
  FROM tmp_occidente_import staged
  JOIN tmp_occidente_category_lookup lookup ON lookup.name = staged.category_name
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

WITH ctx AS (SELECT user_id FROM tmp_occidente_context LIMIT 1),
ranked_staged AS (
  SELECT staged.*,
    ROW_NUMBER() OVER (
      PARTITION BY staged.income_source, staged.amount, staged.currency, staged.description, staged.date
      ORDER BY staged.statement_index, staged.statement_row
    ) AS occurrence
  FROM tmp_occidente_import staged
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

SELECT 'statement_rows' AS metric, COUNT(*)::TEXT AS value FROM tmp_occidente_import
UNION ALL SELECT 'staged_expenses', COUNT(*)::TEXT FROM tmp_occidente_import WHERE row_type = 'expense'
UNION ALL SELECT 'staged_incomes', COUNT(*)::TEXT FROM tmp_occidente_import WHERE row_type = 'income'
UNION ALL SELECT 'expense_total_cop', SUM(amount)::TEXT FROM tmp_occidente_import WHERE row_type = 'expense'
UNION ALL SELECT 'income_total_cop', SUM(amount)::TEXT FROM tmp_occidente_import WHERE row_type = 'income'
UNION ALL SELECT 'resolved_user_id', user_id::TEXT FROM tmp_occidente_context;

COMMIT;
