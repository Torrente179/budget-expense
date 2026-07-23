# Warning amber retune

## Summary

Replaced the muddy light-mode warning brown (`#9a6210`) with a cleaner amber-gold (`#d49412`) so pace rings, bars, and warning badges match the cool-neutral + teal + rose system instead of reading as ochre.

## Product Changes

- “Ahead of pace” / warning tone UI (home budget pace chart and other warning accents) now uses a brighter amber that sits cleanly between success teal and danger rose.

## Validation

- Token update only in `src/app/globals.css` (`--warning`, `--warning-subtle`); dark mode warning left as-is.
- Visual check: home pace ring/bar and status pill should read gold-amber, not brown.
