# Fix capture category UUID and mobile layout

## Summary

The add-expense sheet showed a category UUID in the trigger because Base UI Select renders the raw value unless labels are supplied. Also stacked Category/Date and pinned the submit button so the mobile sheet no longer overlaps fields.

## Product Changes

- Category select shows the translated category name (via `items` + selected label), not the UUID.
- Category and Date are full-width stacked fields (no side-by-side overlap on mobile).
- Submit button sits in a dedicated footer with safe-area padding instead of colliding with the form.

## Validation

- Open Add movement on mobile → pick a category → trigger shows the name.
- Category and Date no longer overlap; Add expense button stays cleanly at the bottom.
