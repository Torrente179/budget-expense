# Declutter Budgets & Investments mobile layout

## Summary

Applied "delete before optimize" principles to strip bloat from the Topbar, Presupuestos, and Inversiones pages on mobile. The top bar, header, summary sections, navigation, and overview cards are now leaner and no longer compete for space on small screens.

## Product Changes

### Topbar (Global)
- **Language and currency selectors removed from the top bar on mobile** (< sm). Moved into the hamburger side-menu so they are still accessible but no longer waste horizontal space every session.
- Mobile topbar now shows only: hamburger, logo, search, and theme toggle.

### PageHeader (Global)
- Stacks vertically on mobile (title full-width, actions wrap below) instead of cramming everything into one row.

### All action buttons (Global)
- Every form trigger button (Add position, Add broker, Add envelope, Copy envelopes, Set monthly plan, Add savings account, Add cash movement, Add watchlist asset, Add investment movement) shows **icon-only below md** (768px), full labels on md+. This covers all phone viewports.

### Presupuestos (Budgets)
- The decorative month/plan-status sub-card ("Aún sin plan mensual") is **hidden on mobile** — the badge already communicates the same info.
- The three metric cards (Consumed, Available, Assigned) now render as a **3-column grid at all breakpoints** instead of stacking vertically on mobile.
- The right sidebar (Envelope balance + Monthly income cards) is **hidden below xl** — that information is redundant with the main summary card on small screens.

### Inversiones (Investments)
- **InvestmentsSectionNav** renders as rounded chip-style toggles on mobile, underlined links on sm+ — clearly distinguishes section navigation from content tabs.
- **InvestmentOverviewCards** show only 2 cards (Market Value, Unrealized P&L) in a compact 2-column grid on mobile; the other 2 (Realized P&L, Open Positions) appear on md+. Card detail text and icons are hidden on small screens.
- **Stocks overview tab**: broker summary + saved brokers sidebar **hidden on mobile** — visible only at xl.
- **Stocks empty state**: verbose description paragraph deleted, replaced with one-liner + compact buttons.
- **Watchlist tab**: "Price refresh" metric card hidden on mobile, remaining 2 cards in a 2-column grid.
- **Savings page**: "Movements" metric card hidden on mobile. Savings accounts sidebar hidden below xl.
- Removed redundant bottom empty-state hint cards from both Stocks and Savings pages.

## Validation

- `next build` completes without errors.
- Desktop layout unchanged — all changes are mobile-first responsive overrides.
- No data model changes.
