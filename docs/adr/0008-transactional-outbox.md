# ADR 0008: Use a transactional outbox and idempotent consumers

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture

## Context

Database changes and message publication cannot share a reliable distributed
transaction. Process crashes must not silently lose events.

## Decision

Write integration events to a PostgreSQL outbox in the state-change transaction. Publish
asynchronously with at-least-once delivery. Consumers use idempotent handlers and inbox
records where necessary.

## Alternatives considered

- Publish directly after commit: rejected because a crash loses events.
- Distributed transactions: rejected due to availability and provider coupling.

## Consequences

Delivery is eventually consistent and duplicates are normal. Outbox age, consumer lag,
dead letters, and replay require operational tooling.
