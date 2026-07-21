# 2026-07-21 — Home budget pace percentage chart

## Summary
Replaced the home “Monthly budgets” thin bar + truncated list with a modern percentage ring chart: overall % used, calendar pace mark, status chip, remaining amount, and every objective with a mini ring + % + bar.

## Product Changes
- Home (when budgets exist): circular % gauge with success / warning / danger tones vs month pace.
- Dot on the ring marks today’s point in the month (current month only).
- Status chip: On pace / Ahead of pace / Under pace / Over budget (EN + ES).
- Each objective shows mini ring %, horizontal fill, and spent / limit; taps open Budget.
- Layout: stacked on mobile; ring beside list from `sm`; stacks again on `lg` (beside the donut column), side-by-side again on `xl`.

## Data Model
No Supabase or schema changes — uses existing custom budget + category spend data.

## Validation
- Empty state (no budgets) unchanged.
- With budgets: large % and per-row % match spent/limit math; over-budget uses danger tone.
