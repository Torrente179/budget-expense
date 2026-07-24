# Liquid-glass floating tab pill

## Summary

The mobile tab bar is now a floating rounded capsule with an iOS-style liquid-glass material: translucent fill, deep backdrop blur, boosted saturation, and specular edge highlights so background cards read through like light through water.

## Product Changes

- Full-width slab → floating `rounded-full` pill inset from the screen edges and home indicator.
- Glass recipe: ~40% white fill (light) / ~8% white (dark), `backdrop-blur-2xl`, `backdrop-saturate-[1.85]`, inset highlight + soft drop shadow.
- Main content bottom padding and capture FAB offset raised so content and the + button clear the floating pill.

## Validation

- On a phone viewport, confirm the tab bar floats as a capsule above the home indicator.
- Scroll Home so cards pass behind the pill — colors should show through, blurred and slightly saturated.
- Confirm all five tabs remain tappable and the FAB clears the pill.
- Spot-check dark mode glass contrast.
