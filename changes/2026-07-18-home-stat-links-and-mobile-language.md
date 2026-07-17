# Home stat links and mobile language access

## Summary

Spent and Income cards on Home now open that month’s movements on the matching tab. Mobile language switching is reachable via a header ENG/ESP control, a fixed account-sheet toggle, and a Language card in Settings.

## Product Changes

- Home **Spent** → `/movements?tab=expenses` (uses the selected month from MonthProvider).
- Home **Income** → `/movements?tab=income`.
- Compact **ENG | ESP** control in the mobile screen header on primary screens.
- Account sheet avatar uses a reliable button (no broken SheetTrigger); language toggle is full-width and labeled.
- Settings opens with a **Language / Idioma** card at the top.

## Validation

- Tap Spent / Income on Home → Movements opens on Expenses / Income for the current month.
- On mobile: change language from the header ENG/ESP, from the account sheet, or from Settings → Language.
