# Donut horizontal callout connectors

## Summary

Replaced kinked radial callout elbows with a short approach into a horizontal run into each label, matching the cleaner leader-line mockup.

## Product Changes

- Top spending callouts now connect with a flat horizontal final segment instead of sharp diagonal kinks.
- Near-equator slices that would reverse through the elbow still use a single clean segment.
- Donut categories, colors, labels, interactions, and legend rows are unchanged.

## Validation

- TypeScript / lint on `breakdown-donut.tsx`.
- Visual check on Home spending donut with five callouts.

## Rollback

Single-purpose commit — revert with:

```bash
git revert --no-edit <this-commit-sha>
git push origin main
```
