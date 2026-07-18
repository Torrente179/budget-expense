# Device-default language (EN/ES)

## Summary

App language now follows the phone/browser primary language. Spanish →
Spanish; anything else → English. An explicit choice in Settings or the
language toggle still wins and is persisted.

## Product Changes

- First visit uses `Accept-Language` (SSR) then `navigator.language` (client)
- Unsupported languages fall back to English
- Device default is soft (not written to storage) until the user picks a language
- `design.md` documents the rule

## Data Model

None. Client keys: `be-locale` + `be-locale-explicit` (only after a manual choice).

## Validation

- Phone/browser set to Spanish → app opens in Spanish
- Phone set to French (or other) → English
- Switch language in Settings → choice sticks across reloads
- Clear site data → returns to device language
