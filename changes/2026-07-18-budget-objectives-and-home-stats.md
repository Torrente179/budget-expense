# Budget as guided objectives, Home stat clarity, underline navigation

## Summary

Second refinement pass from user feedback. "Safe to spend" was unclear as a
hero concept; the stat card tones were inconsistent (green caption under a
white number); the Budget screen didn't teach how budgets work; and the pill
chips (Wealth sub-nav, Movements filter) read as dated. This change makes the
budget model the centerpiece, simplifies Home's numbers to four honest cards,
and replaces every pill/chip switcher with quiet underline tabs.

## Product Changes

- **Home stat row** reordered and re-toned: Income (green) · Spent (white,
  neutral delta caption) · **Current** (income − spent − transfers, replaces
  the safe-to-spend hero as a simple card) · Giving. The hero card is gone.
- **Home budgets area** replaces the hero position: when objectives exist it
  shows what's left of the total plan with a calendar-pace tick plus the top
  3 objectives with progress bars; when none exist it explains the concept
  and offers a "Set up budgets" CTA into /budget
  (`src/components/home/home-screen.tsx`).
- **Budget screen rework** (`src/components/budget/budget-screen.tsx`):
  - First run (no plan, no budgets): a **3-step guided setup** — set monthly
    income, optionally pick a method (50/30/20…), create objectives — each
    step with a plain-language explanation and its action inline.
  - Otherwise: "Your plan" overview (big remaining number, paced bar, plan
    summary line) followed by an **objectives list** — modern rows with
    name, category count, spent/limit, progress and remaining/over caption;
    tap to edit, hover/quick delete. Replaces the old grid of heavy cards.
  - Giving stays as the standing first-fruits objective card.
- **Underline navigation pattern**
  (`src/components/patterns/underline-tabs.tsx`): text + hairline indicator
  replaces filled pill chips. Applied to the Wealth sub-nav
  (Overview/Investments/Savings/Debts) and the Movements filter tabs.

## Validation

- `npm run build` clean (49 routes); lint 0 errors.
- Concurrent onboarding/personalization code preserved (profile-aware copy in
  the guided setup, personalized Home shortcuts untouched).
