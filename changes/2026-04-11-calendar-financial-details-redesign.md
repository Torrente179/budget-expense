# Calendar Financial Details Redesign

## Summary

Redesigned the calendar page to show actual financial information directly in day cells instead of just colored dots. Desktop cells now display up to 3 transaction previews (description + amount, color-coded by type). Mobile cells show compact daily net amounts and colored indicator bars, with a full-width detail panel below the calendar for selected days.

## Product Changes

### Desktop (md+)
- Day cells are now taller (`min-h-[7rem]`) to fit transaction previews
- Each cell shows up to 3 entries with label + compact amount, color-coded:
  - Green: income
  - Red: expense
  - Blue: recurring bill
- Overflow indicator shows "+N more" when a day has >3 transactions
- Sidebar is sticky with `top-6` for comfortable scrolling
- Selected day detail panel now shows daily net total in the header

### Mobile / Tablet (below xl)
- Summary strip: 3 compact stat cards (Net, Income, Expenses) shown above the calendar grid, replacing the desktop sidebar summary
- Day cells show compact daily net amount (e.g., "+$200" or "-$85") with green/red coloring
- Colored indicator bars (wider than previous dots) show transaction types present
- Selected day detail panel renders full-width below the calendar instead of in a sidebar
- Responsive sizing: cells scale from `3.5rem` (mobile) to `4rem` (sm) to `7rem` (md)

### Shared
- New `compactAmount()` helper formats currency without decimals and uses compact notation for values >= 10,000
- New `dayTotals` memo pre-computes daily income/expense sums for cell display
- `CalendarEntry` type unifies income/expense/recurring items for cell previews
- Detail panel shows daily net in header alongside the date

## Data Model

No changes.

## Validation

- Build compiles successfully with no errors
- All existing data fetching logic (dayMap, summary, hooks) preserved unchanged
- Bilingual support (EN/ES) maintained throughout new UI elements
- Responsive breakpoints: mobile (<640px), sm (640px), md (768px), xl (1280px)
