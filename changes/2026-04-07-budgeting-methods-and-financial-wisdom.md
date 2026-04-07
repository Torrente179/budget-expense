# Budgeting methods, financial wisdom, and educational content

## Summary

Added a comprehensive budgeting method selector, expanded financial wisdom content, and integrated biblical/Jewish financial ethics into the app. Users can now explore six budgeting frameworks (50/30/20, 60/30/10, 5 Jars, Zero-based, Pay Yourself First, Values-based), apply them to their monthly plan, and access educational content covering modern tools, biblical stewardship, and Jewish financial traditions.

## Product Changes

### Budgets page
- **Method selector** — new sheet/drawer accessible from the header that lets users browse six budgeting frameworks with visual allocation bars, key principles, scripture references, and "best for" descriptions.
- **Apply method** — selecting "Apply this method to my plan" auto-opens the monthly plan form and pre-fills the allocation percentage from the selected method.
- Applied method shows a summary card inside the monthly plan form with the method name, tagline, and colored slice breakdown.

### Wisdom page (expanded to "Wisdom & guidance")
- Reorganized into a **4-tab layout**:
  1. **Biblical stewardship** — the original theme-based biblical wisdom (unchanged content).
  2. **Budgeting methods** — visual cards for all six methods with allocation bars, principles, and origins.
  3. **Financial principles** — biblical/Christian principles (11 entries with scripture) and Jewish financial ethics (7 entries covering tzedakah, Gemilut Chesed, Shemitah, 5 Jars, and practical budgeting).
  4. **Tools & apps** — descriptions of YNAB, Rocket Money, Empower, EveryDollar, GoodBudget, Tiller, Simplifi, Monarch Money, PocketGuard, plus additional systems (calendar budgeting, values-based, 60% solution).
- All content is fully bilingual (English / Spanish).

### New library files
- `src/lib/budgeting-methods.ts` — six method definitions with typed interfaces, bilingual content, allocation slices with colors/icons, principles with optional scripture, and best-for lists.
- `src/lib/financial-wisdom.ts` — structured educational content for tools, additional systems, biblical principles, and Jewish financial ethics, bilingual.
- `src/components/budgets/method-selector.tsx` — sheet/drawer component with method list view, detail view with allocation breakdown, principles, best-for list, and "apply" action.

## Data Model

No database schema changes. The budgeting methods and educational content are static client-side data organized by locale. The `appliedMethodId` state is ephemeral (lives in React state, not persisted).

## Validation

- Full Next.js production build passes with zero TypeScript errors.
- All new content is bilingual (EN/ES) using the existing `t()` locale pattern.
- Method selector follows the same UI patterns as existing sheet forms (MonthlyPlanForm, BudgetForm) with responsive mobile/desktop behavior.
- Wisdom page tabs gracefully handle all content sections with the existing Card/Badge/Motion component library.
