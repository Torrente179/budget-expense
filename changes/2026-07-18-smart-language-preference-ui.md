# Smart language preference UI

## Summary

Removed the ENG/ESP segmented control from mobile screen headers (it collided with month pickers and actions). Language is now a preference: one-tap toggle chip in desktop/auth chrome, a native-style row in the account sheet, and a radio list in Settings.

## Product Changes

- No language control in primary screen headers.
- Mobile: open the profile avatar → **Language** row (shows current language; tap toggles EN ↔ ES), or go to **Settings → Language**.
- Desktop topbar / login: compact Languages chip (`EN` / `ES`) that toggles on tap.
- Settings: English / Español checklist rows as the canonical chooser.

## Validation

- Home header only shows title + month picker (+ profile avatar); no language pills.
- Account sheet Language row toggles Spanish/English and updates UI immediately.
- Settings Language list selects and persists the choice.
