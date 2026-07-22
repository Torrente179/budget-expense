# Performance and Rebuild Foundation

## Summary

Recorded the measured performance baseline, root causes, acceptance budgets,
rollback controls, and future React/Vite/Supabase/Go strangler architecture in
`docs/performance-and-rebuild-plan.md`. The requested knowledge graph was not
present during the original audit, so the evidence came from source inspection,
production build artifacts, live timing probes, and official framework
documentation. A graph that appeared later reflects the pre-recovery commit
and is retained only as a historical cross-check.

## Product Changes

The decision is to recover the existing Next.js application now and keep the
greenfield Vite/Go stack as a future target. Existing URLs, behavior, design
tokens, Supabase source of truth, and rollback paths remain intact.

## Data Model

Defines typed bootstrap, month snapshot, and household contracts. No database
fork, dual write, destructive migration, or production deployment is part of
this foundation.

## Validation

The record includes SQL parity/RLS/auth/network/build/bundle gates and explicit
Spain-facing latency targets. Production p75/p95 remains a post-deployment
measurement.
