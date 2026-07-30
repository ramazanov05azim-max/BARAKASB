# ADR 0007: Use REST as the primary API and WebSocket for delivery

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture

## Context

The platform requires stable request/response APIs and realtime updates while preserving
explicit Project context and authorization.

## Decision

Use versioned REST resources with Project IDs in routes, OpenAPI contracts, Problem
Details errors, idempotency keys, and optimistic concurrency. Use WebSocket for scoped
notifications with reconnect, cursor-gap, and deduplication semantics.

## Alternatives considered

- GraphQL as the initial public API: rejected because resolver authorization and
  query-cost control add complexity without a demonstrated need.
- WebSocket as authoritative state mutation transport: rejected by default due to retry,
  idempotency, and compatibility complexity.

## Consequences

Clients have a predictable generated contract. Realtime clients must refetch
authoritative state after gaps.
