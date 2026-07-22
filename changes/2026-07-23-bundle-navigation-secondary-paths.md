# Bundle, Navigation, and Secondary Path Recovery

## Summary

Deferred Capture, editing, Command Menu, and Profile contents until first use;
removed the global tooltip provider and Recharts donut; separated lightweight
shell utilities; cached Investments/quotes; bulk-read and deduplicated market
metadata/cache rows; capped provider concurrency; and added exchange-rate CDN
caching. Investments now use a compact overview plus independent paginated
trade, cash, savings, and watchlist caches. Budget/Investment/Savings forms and
below-fold Insights charts are deferred until user or viewport intent.

## Product Changes

No visual redesign. Existing navigation, virtualization, capture optimism,
forms, and reduced-motion behavior remain.

## Data Model

No stored rows are changed by the bundle work. Transactional budget helpers are
part of the additive performance migration.

## Validation

TypeScript, ESLint, balance tests, import parity, and the production build pass.
Eligible app routes are static. Eager JavaScript measures 191.9 KiB gzip for
the app shell, 207.4 Home, 209.3 Budget, 211.5 Insights shell plus screen, 206.9
Investments, 219.8 Movements, and 207.3 Savings. Deferred feature libraries are
absent from Home's eager chunks.
