# Merge Gastos, Ingresos, and Total into Movimientos

## Summary

Replaced the three separate navigation destinations — Gastos (Expenses), Ingresos (Incomes), and Total (Available Now) — with a single **Movimientos** page. This page shows all financial movements (expenses + income) in a unified, banking-app-style list grouped by day. Search is icon-only on mobile, expanding on tap.

## Product Changes

- **New `/movimientos` page**: combines expenses and income into one chronological list, grouped by day headers (`LUNES 6 ABRIL 2026`).
- **Tab filters**: Todos (all) / Gastos (expenses) / Ingresos (income) to narrow the view.
- **Summary card**: shows net balance, income total, and expense total for the selected month.
- **Inline CRUD**: tap a row to edit (opens existing expense/income form sheet); subtle trash icon for delete with confirmation dialog.
- **Search**: icon-only on mobile, always-visible input on desktop.
- **Quick add buttons**: "+ Gasto" and "+ Ingreso" inline below tabs.
- **Navigation simplified**: sidebar, mobile bottom nav, and command palette now show a single "Movimientos" item instead of three separate entries.

## Validation

- Existing `/expenses` and `/incomes` routes and API endpoints are preserved (no breaking changes to data layer).
- All CRUD operations (add, edit, delete) for both expenses and incomes remain functional through existing hooks and API routes.
- Navigation updated across sidebar, mobile bottom nav, mobile slide-out menu, and command palette.
