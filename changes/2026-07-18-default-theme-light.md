# Default theme light

## Summary

New visitors (and anyone without a saved theme preference) now land in
light mode instead of dark.

## Product Changes

- `ThemeProvider` `defaultTheme` changed from `dark` to `light`
- System preference toggle and saved user choice are unchanged

## Data Model

None.

## Validation

- Hard-refresh with cleared site data → light theme
- Toggle to dark in Settings / profile sheet → still persists
