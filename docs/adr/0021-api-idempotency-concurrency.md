# ADR 0021: Use scoped idempotency and optimistic concurrency

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** API Platform

## Context

Clients, gateways, and workers retry after timeouts without knowing whether a mutation
committed. Concurrent updates can overwrite one another even when each request is
individually valid.

## Decision drivers

- safe retry after ambiguous failures;
- stable behavior for concurrent duplicates;
- prevention of silent lost updates;
- Project-scoped capacity and security.

## Decision

Retryable mutations accept an `Idempotency-Key` scoped to actor, Project, operation, and
normalized request hash. An atomic record tracks in-progress, completed, or
retryable-failure state. A different request with the same key returns conflict;
completed retries replay the status and response reference.

Mutable versioned resources use optimistic concurrency through an entity version or
`ETag`/`If-Match`. A stale version returns a stable concurrency conflict.

## Why this option

It handles real network retry behavior without serializing every request or pretending
the transport provides exactly-once execution. Optimistic concurrency suits workloads
where conflicting writes are exceptional.

## Alternatives considered

- Client-generated resource IDs only: rejected because they do not cover arbitrary
  commands or response replay.
- Pessimistic locking for every mutation: rejected because long waits and deadlocks
  reduce throughput and resilience.
- Last-write-wins: rejected for governed state because it silently loses updates.

## Consequences

Idempotency storage needs TTL, quotas, response-retention policy, and cleanup. APIs must
document which operations and versions support retry.

## Validation

Tests issue concurrent duplicates, changed hashes, timeouts before/after commit, stale
versions, and retries across API instances.
