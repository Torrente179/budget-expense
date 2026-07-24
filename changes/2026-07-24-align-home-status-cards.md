# Align home status cards with content gutter

## Summary

On mobile Home (Inicio), the Income / Spent / Available / Giving carousel used a `-mx-4 px-4` edge bleed so cards could scroll full-bleed. That left the first card sitting slightly left of the Presupuestos and “A dónde se fue” cards. The row now stays in the shared Screen gutter so the left edges line up.

## Product Changes

- Status cards on Inicio align with the cards below on mobile.
- Horizontal scroll still works; cards clip at the content gutter instead of the screen edge.

## Validation

- Open Inicio on a narrow viewport and confirm Ingresos lines up with Presupuestos del mes.
- Confirm the row still scrolls horizontally through Disponible and Generosidad.
- Confirm `sm+` still shows the 2/4-column grid with no bleed.
