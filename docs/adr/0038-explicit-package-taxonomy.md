# ADR 0038: Use explicit contract and infrastructure package zones

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture, Developer Experience

## Context

A generic `shared` package zone tends to accumulate unrelated helpers, DTOs, provider
types, and business rules. Its dependency direction becomes ambiguous as the repository
grows.

## Decision

Replace the generic shared zone with:

- `packages/contracts` for side-effect-free schemas and compatibility metadata;
- `packages/infrastructure` for technical adapter implementations.

Every project has exactly one type, scope, and runtime tag. Contract packages may depend
only on contracts. Infrastructure implements ports owned by application/domain modules
and exposes no business semantics.

## Why this decision

The directory itself communicates dependency intent, and automated policies can reject
an ambiguous dumping ground.

## Alternatives considered

- Keep `packages/shared`: rejected because review conventions do not prevent gradual
  boundary erosion.
- Duplicate all primitives: rejected because governed universal contracts are
  legitimately reusable.

## Consequences

Code placement requires an explicit classification. Some adapters may be composed at
application roots rather than imported directly by domain packages.

## Validation

The architecture checker validates zones, project tags, names, and forbidden legacy
paths.

## Revisit when

A new package category has a stable dependency role that cannot fit either zone.
