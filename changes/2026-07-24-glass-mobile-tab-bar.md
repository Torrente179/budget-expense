# Glass mobile tab bar

## Summary

The mobile bottom tab bar now uses an iOS-style frosted glass material: translucent fill, stronger backdrop blur, light saturation, and a hairline top highlight. Content scrolling underneath shows through instead of sitting behind a near-opaque slab.

## Product Changes

- Tab bar fill drops from ~92% opaque to ~55% when `backdrop-filter` is supported (~45% in dark mode).
- Blur increased (`backdrop-blur-2xl`) with `backdrop-saturate-150` for the classic frosted look.
- Soft inset top highlight mimics a glass edge; browsers without backdrop-filter keep a solid-enough fallback.

## Validation

- On a phone or narrow viewport, scroll Home so a card passes under the tab bar — cards should read through the blur.
- Confirm active tab (Inicio) stays dark/bold and inactive tabs stay muted.
- Confirm the capture FAB still clears the bar.
- Spot-check dark mode if available.
