#!/usr/bin/env python3
"""Generate a reconciled, idempotent Supabase import from Banco de Occidente PDFs."""

from __future__ import annotations

import argparse
import csv
import re
import subprocess
import tempfile
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path


CATEGORY_DEFINITIONS = {
    "Food & Dining": ("utensils", "#ef4444", True),
    "Transportation": ("car", "#f97316", True),
    "Housing": ("home", "#eab308", True),
    "Utilities": ("zap", "#84cc16", True),
    "Shopping": ("shopping-bag", "#8b5cf6", True),
    "Healthcare": ("heart-pulse", "#ec4899", True),
    "Subscriptions": ("repeat", "#f43f5e", True),
    "Groceries": ("shopping-cart", "#22c55e", True),
    "Other": ("more-horizontal", "#64748b", True),
    "Taxes": ("landmark", "#b91c1c", False),
    "Personal Care": ("sparkles", "#c026d3", False),
}

EXPENSE_CATEGORIES = {
    "APPLE.COM BILL RTINO": "Subscriptions",
    "APPLE.COM/BILL RTINO": "Subscriptions",
    "APPLE.COM/BILL RTNO": "Subscriptions",
    "BOLD SA*RESTAURA TA D C": "Food & Dining",
    "BOLD SA*SERVITEC TA D C": "Transportation",
    "BOLD*ELSA RICURAS RE NDI": "Food & Dining",
    "BOLD*restaurante chi": "Food & Dining",
    "BRE-B ENVIADA OTROS BANCOS": "Other",
    "CARNICERIA Y SALS LOS DI": "Groceries",
    "CC ALFAGUARA A": "Other",
    "CITY PARKING": "Transportation",
    "COMPRA QR RETIRO / TRANSFERENCIA CON LLAVE DEBITO": "Other",
    "COSMETIC SHOP MALL PL": "Personal Care",
    "DOLLARCITY CC ALFAGUA NDI": "Shopping",
    "DOLLARCITY CENCO MALL": "Shopping",
    "DOLLARCITY HOLGUINES": "Shopping",
    "DOLLARCITY LA 9": "Shopping",
    "DOMINOS PIZZA EL DORA DI": "Food & Dining",
    "DROG CRUZ VERDE ALFAG DI": "Healthcare",
    "EDS JAMUNDI A": "Transportation",
    "EL ANTOJO DE JAMUNDA NDI": "Food & Dining",
    "EL ANTOJO DE JAMUNDI NDI": "Food & Dining",
    "EL ANTOJO PANAMERICAN NDI": "Food & Dining",
    "ESTACION DE SERVICIO": "Transportation",
    "EXITO WOW JAMUNDI NDI": "Groceries",
    "FD SAN JORGE COUNTRYM NDI": "Healthcare",
    "FOOD GROUP COLOMBIA": "Food & Dining",
    "GMF": "Taxes",
    "GOURMET CHARDY EXPRES NDI": "Food & Dining",
    "HOMECENTER CALI SUR": "Housing",
    "IKEA CALI": "Housing",
    "KABUK": "Food & Dining",
    "KRIKA COSMETIC INTERN": "Personal Care",
    "MERCASTILLO EXPRESS DI": "Groceries",
    "MOVISTAR PAGOSEPAYCO TA": "Utilities",
    "OPECOM EDS LA AUTOPIS": "Transportation",
    "PANADERIA EL SAMAN NDI": "Food & Dining",
    "RECAUDO/PAGO SERVICIOS ELECT": "Other",
    "REXICO Q92 DI": "Food & Dining",
    "SC CIUDAD COUNTRY GO": "Groceries",
    "SUBWAY BODYTECH SANTA": "Food & Dining",
    "SUPER LA GRAN COLOMBI DI": "Groceries",
    "SUPERMERCADO LA GRAN DI": "Groceries",
    "SUPERMERCADOS GALERIA NDI": "Groceries",
    "SURTIBELLEZA LORENA DI": "Personal Care",
    "TIENDA D1 JAMUNDI NAT DI": "Groceries",
    "TIENDA D1 JAMUNDI VER DI": "Groceries",
    "TIENDA D1 VAL JAMUNDI DI": "Groceries",
    "TIENDAS ARA DI": "Groceries",
}

INCOME_SOURCES = {
    "ABONO POR TRANSACCIONES VARIAS": "Other credit",
    "BRE-B RECIBIDA OTROS BANCOS": "Bank transfer received",
    "INTERESES LIQUIDADOS": "Bank interest",
    "PAGO A TERCEROS RECIBIDO DESDE CUENTA PROPIA": "Transfer from own account",
    "PAGO TERCERO RECIBIDO DESDE ACH": "ACH transfer received",
}

ROW_RE = re.compile(
    r"^\s*(?P<day>\d{2})\s+(?P<body>.*?)\s+"
    r"(?P<debit>[\d,]+\.\d{2})\s+(?P<credit>[\d,]+\.\d{2})\s+"
    r"(?P<balance>[\d,]+\.\d{2})\s*$"
)
IDENT_RE = re.compile(r"^(?P<transaction>.*?)\s+(?P<ident>(?:[A-Z]\d{6}|0{7}))$")
SUMMARY_RE = re.compile(
    r"\+\s+(?P<credit_count>\d+)\s+CREDITOS\s+(?P<credits>[\d,]+\.\d{2}).*?"
    r"-\s+(?P<debit_count>\d+)\s+DEBITOS\s+(?P<debits>[\d,]+\.\d{2})",
    re.DOTALL,
)
PREVIOUS_RE = re.compile(r"SALDO ANTERIOR\s+([\d,]+\.\d{2})")
CURRENT_RE = re.compile(r"SALDO ACTUAL\s+([\d,]+\.\d{2})")


def money(value: str) -> Decimal:
    return Decimal(value.replace(",", ""))


def sql_string(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


@dataclass(frozen=True)
class StatementSummary:
    previous: Decimal
    credit_count: int
    credits: Decimal
    debit_count: int
    debits: Decimal
    current: Decimal


@dataclass(frozen=True)
class Movement:
    statement_index: int
    statement_source: str
    statement_period: str
    statement_row: int
    date: str
    transaction: str
    ident: str
    debit: Decimal
    credit: Decimal
    balance: Decimal
    row_type: str
    category_name: str | None
    income_source: str | None

    @property
    def amount(self) -> Decimal:
        return self.debit if self.row_type == "expense" else self.credit


def extract_layout_text(pdf_path: Path) -> str:
    with tempfile.NamedTemporaryFile(suffix=".txt") as output:
        subprocess.run(
            ["pdftotext", "-layout", str(pdf_path), output.name],
            check=True,
            capture_output=True,
        )
        return Path(output.name).read_text(encoding="utf-8")


def parse_statement(statement_index: int, pdf_path: Path) -> tuple[list[Movement], StatementSummary]:
    month = statement_index + 1
    text = extract_layout_text(pdf_path)
    summary_match = SUMMARY_RE.search(text)
    previous_match = PREVIOUS_RE.search(text)
    current_match = CURRENT_RE.search(text)
    if not (summary_match and previous_match and current_match):
        raise RuntimeError(f"{pdf_path}: statement summary not found")

    summary = StatementSummary(
        previous=money(previous_match.group(1)),
        credit_count=int(summary_match.group("credit_count")),
        credits=money(summary_match.group("credits")),
        debit_count=int(summary_match.group("debit_count")),
        debits=money(summary_match.group("debits")),
        current=money(current_match.group(1)),
    )

    rows: list[Movement] = []
    for line in text.splitlines():
        match = ROW_RE.match(line)
        if not match:
            continue
        body = re.sub(r"\s+", " ", match.group("body")).strip()
        ident_match = IDENT_RE.match(body)
        transaction = ident_match.group("transaction").strip() if ident_match else body
        ident = ident_match.group("ident") if ident_match else ""
        debit = money(match.group("debit"))
        credit = money(match.group("credit"))
        if (debit == 0) == (credit == 0):
            raise RuntimeError(f"{pdf_path}: row must contain exactly one non-zero movement: {line}")
        row_type = "expense" if debit else "income"
        category_name = EXPENSE_CATEGORIES.get(transaction) if row_type == "expense" else None
        income_source = INCOME_SOURCES.get(transaction) if row_type == "income" else None
        if row_type == "expense" and category_name is None:
            raise RuntimeError(f"Unclassified expense transaction: {transaction}")
        if row_type == "income" and income_source is None:
            raise RuntimeError(f"Unclassified income transaction: {transaction}")
        rows.append(
            Movement(
                statement_index=statement_index,
                statement_source=pdf_path.name,
                statement_period=f"2026-{month:02d}",
                statement_row=len(rows) + 1,
                date=f"2026-{month:02d}-{int(match.group('day')):02d}",
                transaction=transaction,
                ident=ident,
                debit=debit,
                credit=credit,
                balance=money(match.group("balance")),
                row_type=row_type,
                category_name=category_name,
                income_source=income_source,
            )
        )

    debit_rows = [row for row in rows if row.row_type == "expense"]
    credit_rows = [row for row in rows if row.row_type == "income"]
    debit_total = sum((row.debit for row in rows), Decimal())
    credit_total = sum((row.credit for row in rows), Decimal())
    checks = {
        "debit count": (len(debit_rows), summary.debit_count),
        "credit count": (len(credit_rows), summary.credit_count),
        "debit total": (debit_total, summary.debits),
        "credit total": (credit_total, summary.credits),
        "computed closing": (summary.previous + credit_total - debit_total, summary.current),
        "final row balance": (rows[-1].balance, summary.current),
    }
    failures = [f"{name} {actual} != {expected}" for name, (actual, expected) in checks.items() if actual != expected]
    if failures:
        raise RuntimeError(f"{pdf_path}: " + "; ".join(failures))
    return rows, summary


def build_sql(movements: list[Movement], summaries: list[StatementSummary], email: str) -> str:
    expense_categories = sorted({row.category_name for row in movements if row.category_name})
    category_values = ",\n      ".join(
        f"({sql_string(name)}, {sql_string(CATEGORY_DEFINITIONS[name][0])}, "
        f"{sql_string(CATEGORY_DEFINITIONS[name][1])}, {str(CATEGORY_DEFINITIONS[name][2]).lower()})"
        for name in expense_categories
    )
    lookup_values = ",\n  ".join(f"({sql_string(name)})" for name in expense_categories)
    summary_values = ",\n  ".join(
        f"({index}, {summary.debit_count}, {summary.debits:.2f}, "
        f"{summary.credit_count}, {summary.credits:.2f})"
        for index, summary in enumerate(summaries)
    )
    movement_values = ",\n".join(
        "  ("
        + ", ".join(
            [
                str(row.statement_index),
                str(row.statement_row),
                sql_string(row.row_type),
                sql_string(row.category_name),
                sql_string(row.income_source),
                f"{row.amount:.2f}",
                "'COP'",
                sql_string(row.transaction),
                sql_string(row.date),
            ]
        )
        + ")"
        for row in movements
    )

    return f"""-- Banco de Occidente statements, January-June 2026.
-- Source order: ExtractoOccidente.pdf, then (1) through (5).
-- Reconciled rows: {len(movements)} ({sum(row.row_type == 'expense' for row in movements)} expenses, {sum(row.row_type == 'income' for row in movements)} incomes).
-- Target account requested: {email}

BEGIN;

CREATE TEMP TABLE tmp_occidente_context (user_id UUID NOT NULL);

DO $$
DECLARE
  v_email TEXT := {sql_string(email)};
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
{summary_values};

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
{movement_values};

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
      {category_values}
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
  {lookup_values}
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
"""


def write_audit_csv(path: Path, movements: list[Movement]) -> None:
    fields = [
        "statement_index", "statement_source", "statement_period", "statement_row", "date",
        "transaction", "ident", "debit", "credit", "balance", "row_type",
        "category_name", "income_source",
    ]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        for row in movements:
            writer.writerow({field: getattr(row, field) for field in fields})


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--sql-output", type=Path, required=True)
    parser.add_argument("--audit-output", type=Path, required=True)
    parser.add_argument("pdfs", nargs=6, type=Path, help="PDFs in base, (1), ..., (5) order")
    args = parser.parse_args()

    movements: list[Movement] = []
    summaries: list[StatementSummary] = []
    for statement_index, pdf_path in enumerate(args.pdfs):
        rows, summary = parse_statement(statement_index, pdf_path)
        movements.extend(rows)
        summaries.append(summary)
        print(
            f"{pdf_path.name}: rows={len(rows)} debits={summary.debit_count}/{summary.debits:.2f} "
            f"credits={summary.credit_count}/{summary.credits:.2f} closing={summary.current:.2f}"
        )

    args.sql_output.parent.mkdir(parents=True, exist_ok=True)
    args.audit_output.parent.mkdir(parents=True, exist_ok=True)
    args.sql_output.write_text(build_sql(movements, summaries, args.email), encoding="utf-8")
    write_audit_csv(args.audit_output, movements)
    print(f"generated {len(movements)} rows")
    print(f"sql: {args.sql_output}")
    print(f"audit: {args.audit_output}")


if __name__ == "__main__":
    main()
