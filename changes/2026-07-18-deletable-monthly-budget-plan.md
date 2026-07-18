## Summary

Monthly plans are no longer a one-way door. Users can delete this month’s plan from the plan sheet, and objective delete controls stay visible (not hover-only).

## Product Changes

- “Eliminar plan” in the monthly plan sheet when a plan exists, with confirm copy that expenses/objectives stay.
- Objective trash control always visible on Budget (desktop + mobile).
- Deleting the plan returns the month to “no plan” (setup again if no objectives remain).

## Validation

- Open Budget → refine plan → Delete plan → confirm → plan caption gone; toast success.
- Expenses and objectives remain after plan delete.
- Delete an objective via the trash icon without needing hover.
- Cancel on the confirm dialog leaves the plan intact.
