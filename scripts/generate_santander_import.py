#!/usr/bin/env python3
"""Generate an idempotent Supabase import from a Santander movimientos CSV."""

from __future__ import annotations

import argparse
import csv
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Iterable


DEFAULT_CATEGORIES = [
    ("Food & Dining", "utensils", "#ef4444", True),
    ("Transportation", "car", "#f97316", True),
    ("Housing", "home", "#eab308", True),
    ("Utilities", "zap", "#84cc16", True),
    ("Entertainment", "film", "#06b6d4", True),
    ("Shopping", "shopping-bag", "#8b5cf6", True),
    ("Healthcare", "heart-pulse", "#ec4899", True),
    ("Education", "graduation-cap", "#6366f1", True),
    ("Travel", "plane", "#14b8a6", True),
    ("Subscriptions", "repeat", "#f43f5e", True),
    ("Groceries", "shopping-cart", "#22c55e", True),
    ("Other", "more-horizontal", "#64748b", True),
]

CUSTOM_CATEGORIES = [
    ("Taxes", "landmark", "#b91c1c", False),
    ("Professional Services", "briefcase", "#0369a1", False),
    ("Donations", "heart-handshake", "#d97706", False),
    ("Personal Care", "sparkles", "#c026d3", False),
    ("Tithe / Diezmo", "church", "#10b981", False),
]

CATEGORY_ORDER = [name for name, *_ in DEFAULT_CATEGORIES + CUSTOM_CATEGORIES]

BANK_CATEGORY_MAP = {
    "restaurante": "Food & Dining",
    "supermercado": "Groceries",
    "transferencias": "Other",
    "otras compras": "Shopping",
    "servicios y productos online": "Subscriptions",
    "gasolina": "Transportation",
    "impuestos": "Taxes",
    "electronica": "Shopping",
    "hotel": "Travel",
    "asesores y abogados": "Professional Services",
    "farmacia": "Healthcare",
    "parking y peaje": "Transportation",
    "ropa": "Shopping",
    "solidaridad": "Donations",
    "seguro salud": "Healthcare",
    "internet": "Utilities",
    "television": "Utilities",
    "belleza": "Personal Care",
    "transportes": "Transportation",
    "deporte": "Shopping",
    "material deportivo": "Shopping",
    "medico": "Healthcare",
    "otros seguros": "Healthcare",
    "mantenimiento vehiculo": "Transportation",
    "alquiler y compra": "Housing",
    "seguro auto": "Transportation",
}

PATTERN_RULES = [
    (
        "Taxes",
        (
            "tgss",
            "aeat",
            "agencia tributaria",
            "cotizacion",
            "cotizacion 005",
            "autonomo",
            "autonomos",
            "tax payment",
        ),
    ),
    (
        "Professional Services",
        (
            "gysecan",
            "asesor",
            "asesores",
            "notaria",
            "notaria",
            "legal consulting",
            "abogado",
            "lawyer",
        ),
    ),
    (
        "Personal Care",
        (
            "douglas",
            "druni",
            "beauty",
            "corte pelo",
            "haircut",
            "barber",
            "miguel angel",
        ),
    ),
    (
        "Healthcare",
        (
            "farmacia",
            "generali",
            "health insurance",
            "seguro salud",
            "medico",
            "psicolog",
            "sicolog",
            "nerina",
            "quiro",
            "radiolog",
        ),
    ),
    (
        "Donations",
        (
            "vida nueva",
            "ofrenda",
            "ofrendas",
            "family support",
            "solidaridad",
            "donation",
            "donacion",
        ),
    ),
    (
        "Utilities",
        (
            "movistar",
            "fibra",
            "telefono",
            "telefonia",
            "television",
            "electricidad",
            "luz",
        ),
    ),
    (
        "Subscriptions",
        (
            "anthropic",
            "claude",
            "openai",
            "chatgpt",
            "apple.com/bill",
            "google one",
            "google *cloud",
            "icloud",
            "amazon prime",
            "uber one",
            "vpn",
            "membership",
            "ebanx",
        ),
    ),
    (
        "Travel",
        (
            "airbnb",
            "world2fly",
            "air europa",
            "naviera",
            "flight",
            "ferry",
            "accommodation",
            "hotel",
        ),
    ),
    (
        "Transportation",
        (
            "gas station",
            "gasolina",
            "parking",
            "peaje",
            "metro",
            "transport",
            "serviteca",
            "disa",
            "adana demar",
            "emv",
            "airport parking",
            "seguro auto",
            "vehiculo",
            "airservspain",
            "balneario",
        ),
    ),
    (
        "Groceries",
        (
            "mercadona",
            "hiperdino",
            "hiper dino",
            "lidl",
            "tienda d1",
            "spar",
            "rodcam",
            "charcuteria",
            "house consumables",
            "mercado",
            "supermarket",
        ),
    ),
    (
        "Shopping",
        (
            "amazon",
            "alipay",
            "media markt",
            "bazar",
            "el corte ingles",
            "decathlon",
            "dollarcity",
            "emma sleep",
            "tiger",
            "uniqlo",
            "electronics",
            "backpack",
        ),
    ),
    (
        "Education",
        (
            "instituto cervantes",
            "cervantes",
            "education",
            "course",
        ),
    ),
    (
        "Entertainment",
        (
            "cine",
            "cinema",
            "movie",
        ),
    ),
    (
        "Housing",
        (
            "rent",
            "renta",
            "alquiler",
            "housing",
            "deposit",
        ),
    ),
    (
        "Food & Dining",
        (
            "cafe",
            "cafeter",
            "restaurante",
            "restaurant",
            "burger",
            "starbucks",
            "granier",
            "pasteler",
            "panader",
            "helados",
            "coffee",
            "croissant",
            "cheese cake",
            "comida",
            "churreria",
            "kiosco",
            "kiosko",
            "terraza",
            "banana castillo",
            "too good to go",
            "tip top",
            "creperia",
            "guachinche",
            "mistura",
            "palmelita",
            "tres de mayo",
            "rincon",
            "nazar",
            "bambu",
            "antojitos",
            "ramen",
            "ziao paolo",
            "coral",
            "nook urban",
            "backer",
            "venecanarias",
            "ibericos ponce",
            "palmeritas",
            "pergamino",
            "baker",
            "pollo al carbon",
            "cafe alfaguara",
            "d cafe",
            "crepes",
            "waffles",
            "ananda",
            "todo fresa",
            "tgtg",
            "toogoodtogo",
            "montaditos",
            "sidreria",
            "7 canadas",
            "teleferico",
            "menester",
        ),
    ),
]


@dataclass(frozen=True)
class ExpenseRow:
    category_name: str
    amount: Decimal
    currency: str
    description: str
    date: str


@dataclass(frozen=True)
class IncomeRow:
    source: str
    amount: Decimal
    currency: str
    description: str
    date: str


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def normalize_for_match(value: str) -> str:
    simplified = unicodedata.normalize("NFKD", value)
    ascii_only = "".join(char for char in simplified if not unicodedata.combining(char))
    return normalize_spaces(ascii_only).lower()


def strip_quotes(value: str) -> str:
    return value.strip().strip('"').strip()


def parse_amount(value: str) -> Decimal:
    normalized = strip_quotes(value).replace(".", "").replace(",", ".")
    return Decimal(normalized)


def parse_date(value: str) -> str:
    return datetime.strptime(strip_quotes(value), "%d/%m/%y").strftime("%Y-%m-%d")


def clean_concept(value: str) -> str:
    cleaned = normalize_spaces(strip_quotes(value))
    return cleaned.rstrip(".,")


def smart_title(value: str) -> str:
    tokens = [token for token in re.split(r"(\s+)", value) if token]
    titled: list[str] = []
    for token in tokens:
        if token.isspace():
            titled.append(token)
            continue
        if token.isupper() and len(token) > 1:
            titled.append(token)
        elif token.lower() in {"ai", "tgss", "aeat", "tv", "ssp"}:
            titled.append(token.upper())
        else:
            titled.append(token.capitalize())
    return "".join(titled)


def compact_suffix(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = normalize_spaces(value).strip(" .,-")
    if not cleaned:
        return None
    if normalize_for_match(cleaned) in {"sin concepto", "concepto sin concepto"}:
        return None
    return cleaned


def build_transfer_label(prefix: str, name: str, detail: str | None = None) -> str:
    base = f"{prefix} {smart_title(normalize_spaces(name))}".strip()
    if detail:
        return f"{base} - {detail}"
    return base


def friendly_label(raw_concept: str) -> str:
    concept = clean_concept(raw_concept)
    patterns = [
        (
            re.compile(r"^pago movil en ([^,]+)", re.IGNORECASE),
            lambda match: smart_title(match.group(1)),
        ),
        (
            re.compile(r"^compra en ([^,]+)", re.IGNORECASE),
            lambda match: smart_title(match.group(1)),
        ),
        (
            re.compile(r"^devolucion compra en ([^,]+)", re.IGNORECASE),
            lambda match: f"Refund - {smart_title(match.group(1))}",
        ),
        (
            re.compile(r"^transferencia inmediata a favor de ([^,]+?)(?:, concepto:? ?(.*))?$", re.IGNORECASE),
            lambda match: build_transfer_label(
                "Transfer to",
                match.group(1),
                compact_suffix(match.group(2)),
            ),
        ),
        (
            re.compile(r"^transferencia inmediata de ([^,]+?)(?:, concepto:? ?(.*))?$", re.IGNORECASE),
            lambda match: build_transfer_label(
                "Transfer from",
                match.group(1),
                compact_suffix(match.group(2)),
            ),
        ),
        (
            re.compile(r"^transferencia de ([^,]+?)(?:, concepto:? ?(.*))?$", re.IGNORECASE),
            lambda match: build_transfer_label(
                "Transfer from",
                match.group(1),
                compact_suffix(match.group(2)),
            ),
        ),
        (
            re.compile(r"^bizum a favor de ([^,]+?)(?: concepto:? ?(.*))?$", re.IGNORECASE),
            lambda match: build_transfer_label(
                "Bizum to",
                match.group(1),
                compact_suffix(match.group(2)),
            ),
        ),
        (
            re.compile(r"^bizum de ([^,]+?)(?: concepto:? ?(.*))?$", re.IGNORECASE),
            lambda match: build_transfer_label(
                "Bizum from",
                match.group(1),
                compact_suffix(match.group(2)),
            ),
        ),
        (
            re.compile(r"^ingreso anonimo contra cuenta.*?(?:concepto:? ?(.*))?$", re.IGNORECASE),
            lambda match: build_transfer_label(
                "Cash deposit",
                "",
                compact_suffix(match.group(1)),
            ).strip(" -"),
        ),
        (
            re.compile(r"^recibo tgss\.(.*)$", re.IGNORECASE),
            lambda match: f"TGSS {compact_suffix(match.group(1)) or 'charge'}",
        ),
    ]

    for pattern, builder in patterns:
        match = pattern.match(concept)
        if match:
            return normalize_spaces(builder(match))[:160]

    return concept[:160]


def classify_expense(bank_category: str, concept: str) -> str:
    normalized_concept = normalize_for_match(concept)
    normalized_category = normalize_for_match(bank_category)

    for category_name, patterns in PATTERN_RULES:
        if any(pattern in normalized_concept for pattern in patterns):
            return category_name

    return BANK_CATEGORY_MAP.get(normalized_category, "Other")


def sql_string(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def decimal_string(value: Decimal) -> str:
    return format(value.quantize(Decimal("0.01")), "f")


def chunked(rows: Iterable[str], size: int) -> Iterable[list[str]]:
    chunk: list[str] = []
    for row in rows:
        chunk.append(row)
        if len(chunk) == size:
            yield chunk
            chunk = []
    if chunk:
        yield chunk


def assign_tithe_from_wise_transfers(
    expenses: list[ExpenseRow],
    incomes: list[IncomeRow],
    explicit_monthly_income: Decimal | None = None,
) -> tuple[list[ExpenseRow], int]:
    """For each month, find the Wise transfer closest to 10 % of income and
    reclassify it as 'Tithe / Diezmo'.

    Returns the (possibly updated) expense list and the count of tithe
    assignments made.
    """
    income_by_month: dict[str, Decimal] = {}
    for inc in incomes:
        month = inc.date[:7]
        income_by_month[month] = income_by_month.get(month, Decimal(0)) + inc.amount

    # If an explicit monthly income is given, use it for every month that has
    # Wise transfers (overrides CSV-derived income when the latter is lower).
    if explicit_monthly_income:
        wise_months = {exp.date[:7] for exp in expenses if "wise" in exp.description.lower()}
        for month in wise_months:
            income_by_month[month] = max(
                income_by_month.get(month, Decimal(0)),
                explicit_monthly_income,
            )

    # Group expense indices that look like Wise transfers, by month.
    wise_indices_by_month: dict[str, list[int]] = {}
    for i, exp in enumerate(expenses):
        if "wise" in exp.description.lower():
            month = exp.date[:7]
            wise_indices_by_month.setdefault(month, []).append(i)

    result = list(expenses)
    tithe_count = 0

    for month, indices in wise_indices_by_month.items():
        monthly_income = income_by_month.get(month, Decimal(0))
        if monthly_income <= 0:
            continue

        tithe_target = monthly_income * Decimal("0.10")
        best_idx = min(indices, key=lambda i: abs(result[i].amount - tithe_target))
        best_diff = abs(result[best_idx].amount - tithe_target)

        # Accept if within 25 % tolerance of the tithe target.
        if tithe_target > 0 and best_diff / tithe_target <= Decimal("0.25"):
            old = result[best_idx]
            result[best_idx] = ExpenseRow(
                category_name="Tithe / Diezmo",
                amount=old.amount,
                currency=old.currency,
                description=old.description,
                date=old.date,
            )
            tithe_count += 1

    return result, tithe_count


def build_import_sql(
    expenses: list[ExpenseRow],
    incomes: list[IncomeRow],
    source_path: str,
    explicit_user_id: str | None,
) -> str:
    required_category_names = sorted({row.category_name for row in expenses}, key=CATEGORY_ORDER.index)

    default_category_rows = [
        row for row in DEFAULT_CATEGORIES if row[0] in required_category_names
    ]
    custom_category_rows = [
        row for row in CUSTOM_CATEGORIES if row[0] in required_category_names
    ]

    expense_lines = [
        "  ("
        + ", ".join(
            [
                sql_string(row.category_name),
                decimal_string(row.amount),
                sql_string(row.currency),
                sql_string(row.description),
                sql_string(row.date),
            ]
        )
        + ")"
        for row in expenses
    ]
    income_lines = [
        "  ("
        + ", ".join(
            [
                sql_string(row.source),
                decimal_string(row.amount),
                sql_string(row.currency),
                sql_string(row.description),
                sql_string(row.date),
            ]
        )
        + ")"
        for row in incomes
    ]

    default_category_values = ",\n      ".join(
        f"({sql_string(name)}, {sql_string(icon)}, {sql_string(color)}, true)"
        for name, icon, color, _ in default_category_rows
    )
    custom_category_values = ",\n      ".join(
        f"({sql_string(name)}, {sql_string(icon)}, {sql_string(color)}, false)"
        for name, icon, color, _ in custom_category_rows
    )
    lookup_values = ",\n  ".join(f"({sql_string(name)})" for name in required_category_names)

    sql_lines = [
        "-- Generated from Santander movimientos.csv",
        f"-- Source file: {source_path}",
        f"-- Expenses staged: {len(expenses)}",
        f"-- Income/refund rows staged: {len(incomes)}",
        "-- Internal transfers (No computable) are intentionally skipped.",
        "-- If your project has more than one auth user, set v_uid or v_user_email in the first DO block.",
        "",
        "BEGIN;",
        "",
        "CREATE TEMP TABLE tmp_import_context (user_id UUID NOT NULL);",
        "",
        "DO $$",
        "DECLARE",
        f"  v_uid UUID := {sql_string(explicit_user_id)};",
        "  v_user_email TEXT := NULL;",
        "  v_user_count INTEGER;",
        "  v_resolved_uid UUID;",
        "  v_name TEXT;",
        "  v_icon TEXT;",
        "  v_color TEXT;",
        "  v_is_default BOOLEAN;",
        "BEGIN",
        "  IF v_uid IS NULL AND v_user_email IS NOT NULL THEN",
        "    SELECT id INTO v_uid",
        "    FROM auth.users",
        "    WHERE lower(email) = lower(v_user_email)",
        "    LIMIT 1;",
        "  END IF;",
        "",
        "  IF v_uid IS NULL THEN",
        "    SELECT COUNT(*) INTO v_user_count FROM auth.users;",
        "    IF v_user_count = 1 THEN",
        "      SELECT id INTO v_uid FROM auth.users LIMIT 1;",
        "    ELSE",
        "      RAISE EXCEPTION USING MESSAGE =",
        "        'Multiple auth users found. Set v_uid or v_user_email inside this script before running it.';",
        "    END IF;",
        "  END IF;",
        "",
        "  SELECT v_uid INTO v_resolved_uid;",
        "  DELETE FROM tmp_import_context;",
        "  INSERT INTO tmp_import_context (user_id) VALUES (v_resolved_uid);",
        "",
    ]

    if default_category_rows:
        sql_lines.extend(
            [
                "  FOR v_name, v_icon, v_color, v_is_default IN",
                "    SELECT * FROM (VALUES",
                f"      {default_category_values}",
                "    ) AS categories(name, icon, color, is_default)",
                "  LOOP",
                "    INSERT INTO public.categories (id, user_id, name, icon, color, is_default)",
                "    SELECT gen_random_uuid(), NULL, v_name, v_icon, v_color, true",
                "    WHERE NOT EXISTS (",
                "      SELECT 1",
                "      FROM public.categories",
                "      WHERE name = v_name AND is_default = true",
                "    );",
                "  END LOOP;",
                "",
            ]
        )

    if custom_category_rows:
        sql_lines.extend(
            [
                "  FOR v_name, v_icon, v_color, v_is_default IN",
                "    SELECT * FROM (VALUES",
                f"      {custom_category_values}",
                "    ) AS categories(name, icon, color, is_default)",
                "  LOOP",
                "    INSERT INTO public.categories (id, user_id, name, icon, color, is_default)",
                "    SELECT gen_random_uuid(), NULL, v_name, v_icon, v_color, false",
                "    WHERE NOT EXISTS (",
                "      SELECT 1",
                "      FROM public.categories",
                "      WHERE name = v_name AND user_id IS NULL AND is_default = false",
                "    );",
                "  END LOOP;",
                "END $$;",
                "",
            ]
        )
    else:
        sql_lines.append("END $$;")
        sql_lines.append("")

    sql_lines.extend(
        [
            "CREATE TEMP TABLE tmp_category_lookup AS",
            "WITH ctx AS (SELECT user_id FROM tmp_import_context LIMIT 1)",
            "SELECT needed.name,",
            "  (",
            "    SELECT categories.id",
            "    FROM public.categories",
            "    CROSS JOIN ctx",
            "    WHERE categories.name = needed.name",
            "      AND (categories.user_id = ctx.user_id OR categories.user_id IS NULL)",
            "    ORDER BY CASE",
            "      WHEN categories.user_id = ctx.user_id THEN 0",
            "      WHEN categories.is_default = true THEN 1",
            "      ELSE 2",
            "    END",
            "    LIMIT 1",
            "  ) AS category_id",
            "FROM (VALUES",
            f"  {lookup_values}",
            ") AS needed(name);",
            "",
            "CREATE TEMP TABLE tmp_expense_import (",
            "  category_name TEXT NOT NULL,",
            "  amount DECIMAL(12, 2) NOT NULL,",
            "  currency TEXT NOT NULL,",
            "  description TEXT NOT NULL,",
            "  date DATE NOT NULL",
            ");",
            "",
        ]
    )

    for chunk in chunked(expense_lines, 250):
        sql_lines.extend(
            [
                "INSERT INTO tmp_expense_import (category_name, amount, currency, description, date)",
                "VALUES",
                ",\n".join(chunk) + ";",
                "",
            ]
        )

    sql_lines.extend(
        [
            "CREATE TEMP TABLE tmp_income_import (",
            "  source TEXT NOT NULL,",
            "  amount DECIMAL(12, 2) NOT NULL,",
            "  currency TEXT NOT NULL,",
            "  description TEXT NOT NULL,",
            "  date DATE NOT NULL",
            ");",
            "",
        ]
    )

    for chunk in chunked(income_lines, 250):
        sql_lines.extend(
            [
                "INSERT INTO tmp_income_import (source, amount, currency, description, date)",
                "VALUES",
                ",\n".join(chunk) + ";",
                "",
            ]
        )

    sql_lines.extend(
        [
            "DO $$",
            "BEGIN",
            "  IF EXISTS (SELECT 1 FROM tmp_category_lookup WHERE category_id IS NULL) THEN",
            "    RAISE EXCEPTION USING MESSAGE = 'Category lookup failed for one or more staged expense rows.';",
            "  END IF;",
            "END $$;",
            "",
            "WITH ctx AS (SELECT user_id FROM tmp_import_context LIMIT 1)",
            "INSERT INTO public.expenses (user_id, category_id, amount, currency, description, date)",
            "SELECT ctx.user_id, lookup.category_id, staged.amount, staged.currency, staged.description, staged.date",
            "FROM tmp_expense_import AS staged",
            "JOIN tmp_category_lookup AS lookup ON lookup.name = staged.category_name",
            "CROSS JOIN ctx",
            "LEFT JOIN public.expenses AS existing",
            "  ON existing.user_id = ctx.user_id",
            " AND existing.category_id = lookup.category_id",
            " AND existing.amount = staged.amount",
            " AND existing.currency = staged.currency",
            " AND existing.date = staged.date",
            " AND COALESCE(existing.description, '') = staged.description",
            "WHERE existing.id IS NULL;",
            "",
            "WITH ctx AS (SELECT user_id FROM tmp_import_context LIMIT 1)",
            "INSERT INTO public.income_entries (user_id, source, amount, currency, description, date)",
            "SELECT ctx.user_id, staged.source, staged.amount, staged.currency, staged.description, staged.date",
            "FROM tmp_income_import AS staged",
            "CROSS JOIN ctx",
            "LEFT JOIN public.income_entries AS existing",
            "  ON existing.user_id = ctx.user_id",
            " AND existing.source = staged.source",
            " AND existing.amount = staged.amount",
            " AND existing.currency = staged.currency",
            " AND existing.date = staged.date",
            " AND COALESCE(existing.description, '') = staged.description",
            "WHERE existing.id IS NULL;",
            "",
            "SELECT 'staged_expenses' AS metric, COUNT(*)::TEXT AS value FROM tmp_expense_import",
            "UNION ALL",
            "SELECT 'staged_income_entries', COUNT(*)::TEXT FROM tmp_income_import",
            "UNION ALL",
            "SELECT 'resolved_user_id', user_id::TEXT FROM tmp_import_context;",
            "",
            "COMMIT;",
            "",
        ]
    )

    return "\n".join(sql_lines)


def build_rows(csv_path: Path) -> tuple[list[ExpenseRow], list[IncomeRow], Counter[str]]:
    expenses: list[ExpenseRow] = []
    incomes: list[IncomeRow] = []
    stats: Counter[str] = Counter()

    with csv_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.reader(handle)
        next(reader)
        for row in reader:
            if not row:
                continue

            date = parse_date(row[0])
            amount = parse_amount(row[2])
            currency = strip_quotes(row[3]) or "EUR"
            concept = clean_concept(row[4])
            movement_kind = normalize_spaces(row[8])
            bank_category = normalize_spaces(row[9])
            label = friendly_label(concept)

            if movement_kind == "No computable":
                stats["skipped_no_computable"] += 1
                continue

            if movement_kind == "Ingreso" or (movement_kind == "Gasto" and amount > 0):
                incomes.append(
                    IncomeRow(
                        source=label[:100],
                        amount=abs(amount),
                        currency=currency,
                        description=concept,
                        date=date,
                    )
                )
                stats["income_rows"] += 1
                continue

            if movement_kind != "Gasto":
                stats["skipped_unknown_kind"] += 1
                continue

            expenses.append(
                ExpenseRow(
                    category_name=classify_expense(bank_category, concept),
                    amount=abs(amount),
                    currency=currency,
                    description=label,
                    date=date,
                )
            )
            stats["expense_rows"] += 1

    return expenses, incomes, stats


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", required=True, help="Path to movimientos.csv")
    parser.add_argument("--output", required=True, help="Path to write the generated SQL")
    parser.add_argument(
        "--user-id",
        help="Optional explicit auth.users UUID to bake into the generated SQL",
    )
    parser.add_argument(
        "--monthly-income",
        type=Decimal,
        default=None,
        help="Override monthly income for tithe detection (e.g. 1500.00). "
        "When provided, the Wise transfer closest to 10%% of this amount "
        "is classified as 'Tithe / Diezmo'.",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()

    expenses, incomes, stats = build_rows(csv_path)
    expenses, tithe_count = assign_tithe_from_wise_transfers(
        expenses, incomes, args.monthly_income,
    )
    sql = build_import_sql(expenses, incomes, str(csv_path), args.user_id)
    output_path.write_text(sql + "\n", encoding="utf-8")

    print(f"Wrote {output_path}")
    print(f"Expenses: {stats['expense_rows']}")
    print(f"Income/refunds: {stats['income_rows']}")
    print(f"Skipped internal transfers: {stats['skipped_no_computable']}")
    print(f"Tithe transfers detected: {tithe_count}")


if __name__ == "__main__":
    main()
