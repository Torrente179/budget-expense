# Polish Budgets & Investments Mobile Layout

## Summary

Tightened the mobile layout for Presupuestos and Inversiones to match the compact, polished feel established by Movimientos. Cards, fonts, spacing, and navigation now share the same density and style language across all tabs.

## Product Changes

- **Budgets page**: Pool card uses `rounded-[1.25rem]` / `p-4` on mobile (desktop unchanged). Pool amount shrinks from `3.6rem` to `2rem` on mobile. Verbose description paragraphs hidden on mobile (`hidden md:block`). Stat tiles use `rounded-xl` / `p-3` with `text-lg` on mobile, scaling up on desktop. Sidebar cards (envelope balance, monthly income) receive the same rounding/padding/shadow treatment. Envelope section title reduced to `1.35rem` on mobile; right-side description hidden.

- **Budget card**: Padding tightened to `p-4` on mobile. Stat grid gap reduced (`gap-2` mobile, `gap-3` desktop). Delete button visible at `opacity-30` on mobile (matches Movimientos pattern).

- **InvestmentsSectionNav**: Converted from pill/toggle style (`rounded-[1.35rem]` container with `ring-1` active) to underline tab style (`border-b-2 border-foreground`) matching Movimientos tabs.

- **Investments pages**: Both stocks and savings pages tightened from `space-y-6` to `space-y-5`.

## Validation

- Build passes with no TypeScript or compilation errors.
- All responsive classes use mobile-first with `md:` or `lg:` overrides — no double rendering.
