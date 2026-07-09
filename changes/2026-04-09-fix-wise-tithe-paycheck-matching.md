# 2026-04-09 — Fix Wise tithe paycheck matching

## Summary

Adjusted the Santander import generator so tithe detection matches paycheck-sized income entries to nearby Wise transfers instead of forcing a single Wise transfer per calendar month. This fixes months like March 2026, where multiple salary deposits each had their own tithe transfer.

## Product Changes

- Tithe detection now supports multiple `Tithe / Diezmo` transfers in the same month when they align with separate paycheck-sized income entries.
- The partial-month `--monthly-income` fallback still works for months that do not include the salary inflows in the CSV slice.
- March 2026 live data can now reflect the expected tithe transfers instead of collapsing everything into `Other`.

## Data Model

- No schema changes.
- Existing `categories` and `expenses` rows are reused; only category assignment logic changed in the generator.

## Validation

- `python3 -m py_compile scripts/generate_santander_import.py`
- Verified the updated matcher flags the March 2026 Wise transfers of `120`, `140`, and `150` EUR as `Tithe / Diezmo` against the corresponding salary inflows.
