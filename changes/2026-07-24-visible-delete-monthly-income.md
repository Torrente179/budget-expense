# Visible edit and delete for monthly income

## Summary

Made monthly income clearly editable and deletable from the Budget tab, so a saved plan never feels permanent or locked.

## Product Changes

- Plan card actions: **Editar** opens the income sheet; trash icon deletes with confirm.
- Income sheet: prominent “Eliminar ingreso de este mes” button; Cancel closes correctly in controlled mode.
- Form resets when the sheet reopens so saved income can be edited reliably.

## Validation

- With a plan present: trash → confirm → income caption gone; budgets/expenses remain.
- Edit → change amount → save → caption updates.
- Cancel closes the sheet without saving.
