# ADR 0023: Let consumers adapt versioned events and control replay

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture

## Context

Integration events outlive producer code and may be replayed into new projections.
Rewriting historical broker data or forcing every producer to understand every consumer
creates coupling.

## Decision drivers

- independently evolvable producers and consumers;
- reproducible projection rebuilds;
- safe bounded replay;
- explicit compatibility ownership.

## Decision

The producer owns a stable event name, schema versions, compatibility mode, and
deprecation window. Historical events remain immutable. Consumers validate and upcast
the versions they support at their boundary.

Replay runs in an isolated consumer namespace with explicit event/time range,
Project/shard scope, rate and concurrency budgets, dry-run where possible, idempotency,
and completion evidence. Replay cannot silently target live side-effect consumers.

## Why this option

Consumer-side adaptation lets each consumer evolve on its schedule while preserving an
immutable factual history. Controlled replay protects production capacity and external
side effects.

## Alternatives considered

- Rewrite historical events: rejected because it destroys reproducibility and audit.
- Producer emits consumer-specific formats: rejected because it couples the producer to
  downstream topology.
- Replay directly into live consumers: rejected because side effects and capacity would
  be unsafe.

## Consequences

Consumers maintain supported upcasters and compatibility tests. Event retention limits
how far a projection can rebuild without an authoritative snapshot.

## Validation

Contract tests run current consumers against supported historical schemas. Replay tests
prove scoping, throttling, idempotency, isolation, and cancellation.
