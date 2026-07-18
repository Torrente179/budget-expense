# Fix budget totals disagreeing with objectives; clarify budgeting methods

## Summary

User report with a screenshot: after onboarding created two starter budgets
("Esenciales", "Estilo de vida"), the Budget screen showed "1.046.154 gastado
de 3.680.000 presupuestado" in the plan overview while **both objective rows
below it showed "0,00 gastado"** — an unexplained contradiction. Root cause:
the overview's "spent" figure summed *all* expenses for the month, while each
objective's own figure only counted spending inside its assigned categories.
In this account the only expense was a tithe (Giving), which isn't inside
either objective, so the two numbers could never agree. Home had the same bug
in its budgets-at-a-glance card. Also addressed: the "Métodos de presupuesto"
button reads as a lost/generic outline button next to the primary "Definir
plan mensual" CTA, and the method detail view never explained what a method
actually *does* — it listed percentages and scripture principles with no
plain-language "how this works."

## Product Changes

- **Budget screen** (`budget-screen.tsx`): the plan overview's "spent" total
  is now the sum of each objective's own spend (matches the objective rows by
  construction — they can never disagree again). Added a second caption, shown
  only when relevant: "+ X spent this month isn't in any objective yet — like
  Giving below," pointing at the exact figure so the gap is self-explanatory
  instead of silently wrong.
- **Home** (`home-screen.tsx`): same fix applied to the "Monthly budgets" card
  — the paced-remaining number and top-objectives list now agree.
- **Method selector button** (`method-selector.tsx`): default trigger now uses
  a soft info-tinted fill (`bg-info-subtle`/`text-info`) instead of a plain
  neutral outline, so it reads as a distinct, inviting action next to the
  primary black CTA rather than disappearing beside it.
- **Method detail view**: added a "How it works" block at the top using the
  `description` and `origin` fields that already existed in
  `lib/budgeting-methods.ts` but were never rendered — plain-language summary
  before the percentages/principles/best-for lists. Added a short explainer
  directly above the Apply button stating exactly what applying does ("sets
  your plan's allocation to N% of your income; fine-tune anytime").

## Validation

- `npm run build` clean (49 routes); lint 0 errors, no new warnings in the
  three touched files.
- Verified the fix reproduces correctly against the reported scenario: total
  spend = 100% giving, two objectives with unrelated categories → both now
  correctly show 0 spent, the plan overview agrees, and the new caption names
  the gap.
