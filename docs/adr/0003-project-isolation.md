# ADR 0003: Enforce Project isolation with PostgreSQL RLS

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture and Security

## Context

One identity can access multiple Projects, but business data must never cross Project
boundaries. Application filters alone are vulnerable to omission.

## Decision

Use mandatory non-null `project_id`, composite constraints, forced PostgreSQL RLS, and
transaction-local verified Project context for every business table. Apply the same
scope to cache, objects, events, jobs, logs, and realtime.

## Alternatives considered

- Application filtering only: rejected as insufficient defense in depth.
- Database per Project initially: rejected because connection, migration, and operating
  cost is disproportionate; the logical model remains shard-ready.
- Schema per Project: rejected because schema and migration counts scale poorly.

## Consequences

Isolation is enforced even after repository mistakes. Persistence adapters and
migrations are more disciplined, and RLS behavior must be tested with the real
restricted database role.

## Revisit when

Regulation, customer contracts, scale, or noisy-neighbor evidence requires physical
placement of Projects on separate shards or databases.
