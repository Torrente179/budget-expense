# Category glyphs restored, and redrawn for the Up style

## Summary

The feed rebuild traded the category icon for the merchant's initial. That lost
a real signal — you could no longer tell what a charge was for at a glance — so
the pictogram is back, redrawn to suit the new style, with a wider and more
literal icon set than before.

## Product Changes

**The feed mark now carries the category glyph.** A saturated tile in the
category colour with the pictogram in white line art. Up's feed marks are
saturated tiles carrying a mark (a real brand logo where one exists); with no
logo assets, the category glyph is the closest honest equivalent, and unlike a
letter it says what the charge *was*. The initial survives only as a fallback
for movements with no category at all, on a tile coloured by a stable hash of
the title so those rows still differ from one another.

**A wider, more literal icon set.** Choices favour the most recognisable object
over an abstract symbol, which is how Up's Trackers read:

| Category | Was | Now |
|---|---|---|
| Food & Dining | `Utensils` | `UtensilsCrossed` |
| Transportation | `Car` | `CarFront` |
| Entertainment | `Film` | `Clapperboard` |
| Healthcare | `HeartPulse` | `Stethoscope` |
| Travel | `Plane` | `PlaneTakeoff` |
| Subscriptions | `Repeat` | `MonitorPlay` |
| Other | `MoreHorizontal` | `CircleEllipsis` |

Newly covered, so they no longer fall through to a generic dot: Salary
(`Wallet`), Taxes (`Landmark`), Professional Services (`Briefcase`), Donations
(`HandHeart`), Personal Care (`Scissors`), Tithe (`Church`), Insurance
(`ShieldCheck`), Cash (`Coins`), Savings (`PiggyBank`), Investments
(`ChartLine`), plus keys for Fuel, Wifi, Gym, Pets and Gifts.

**Nothing breaks for existing rows.** Every legacy icon key is kept and
re-aimed at its replacement rather than deleted, so a row stored as `"film"`
now renders a clapperboard instead of failing to resolve. A second lookup
resolves by category *name* — matched case-insensitively in English and
Spanish — for rows whose stored key is empty or unrecognised.

## Data Model

None. `DEFAULT_CATEGORIES` icon keys changed, which affects only newly seeded
categories; no migration, and existing rows resolve through the legacy keys.

## Validation

- `npx tsc --noEmit` clean; `npx eslint src` 0 errors; `npm run build` compiles,
  56/56 static pages.
- All 36 candidate glyphs were checked against the installed `lucide-react`
  (1.7.0) before being referenced, rather than assumed to exist.
- Rendered 16 categories through the real `TransactionRow` and confirmed each
  resolves to its intended pictogram, including the uncategorised fallback.

## Note

`PALETTE.categories` has a `titheCharity` hue that `DEFAULT_CATEGORIES` never
seeds, so Tithe — a first-class concept elsewhere in the app (`lib/giving.ts`,
`tithe_target_percent`) — has a colour defined but no seeded category to use it.
Left alone: seeding a category writes data and is a product decision, not a
design one.
