# Onboarding budget profile is choosable

## Summary

The onboarding suggestions step no longer locks users into the auto-suggested
budget method. It pre-selects a fit from their goals, and they can tap any
other profile before finishing.

## Product Changes

- Suggestions step shows a selectable list of budgeting methods
- Suggested method is marked and selected by default
- Chosen method is passed through to plan allocation on finish
- Going back and changing goals still updates the suggestion until the user
  picks a different method themselves

## Data Model

None.

## Validation

- Choose “Yes” for budget help → see method list with one marked Suggested
- Tap another method → selection moves; finish saves that profile’s allocation
- Choose “No” for budget help → no method list
