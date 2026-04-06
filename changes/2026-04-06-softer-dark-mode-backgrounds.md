# Softer Dark Mode Backgrounds

## Summary
Replaced the near-pure-black dark mode palette with softer grey-brown blacks for improved readability and a more modern, silky dark experience.

## Product Changes
Dark mode now uses a warm grey-brown tonal palette instead of near-pitch-black:

| Token | Before | After | Role |
|---|---|---|---|
| `--background` | `#070809` | `#1e1e1d` | Main page background |
| `--card` | `#101114` | `#242423` | Card / panel surfaces |
| `--popover` | `#101114` | `#242423` | Popovers & dropdowns |
| `--secondary` | `#17191d` | `#282c34` | Secondary surfaces / hover |
| `--muted` | `#111318` | `#262624` | Muted backgrounds |
| `--accent` | `#17191d` | `#282c34` | Accent surfaces |
| `--sidebar` | `#090a0c` | `#141413` | Sidebar panel |
| `--sidebar-accent` | `#17191d` | `#21252b` | Sidebar hover states |
| `--primary-foreground` | `#090a0c` | `#141413` | Text on primary buttons |
| `--sidebar-primary-foreground` | `#090a0c` | `#141413` | Text on sidebar primary buttons |

Body gradient updated from near-black to match the new tonal range (`#262624 → #212120 → #1e1e1d`). Overlay opacities slightly reduced to avoid washing out the warmer tone.

## Validation
- Verify dark mode background reads as a soft charcoal, not black
- Cards should be visibly lighter than the page background
- Sidebar should be visibly darker than the page background
- Text contrast (white on dark) should remain crisp
