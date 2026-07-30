# ADR 0016: Assign explicit authoritative roles to storage systems

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Data Platform and Platform Architecture

## Context

PostgreSQL, Redis, object storage, and an event broker have different consistency,
durability, cost, and scaling properties. Treating them as interchangeable creates
ambiguous recovery and data-loss behavior.

## Decision drivers

- one unambiguous source of truth;
- recoverability after cache or broker loss;
- efficient binary storage;
- future sharding without changing domain contracts.

## Decision

- PostgreSQL is authoritative for platform and business state.
- Object storage is authoritative for binary objects referenced by PostgreSQL metadata.
- Redis is ephemeral and may provide cache, rate limits, presence, and advisory
  coordination only.
- The event broker transports versioned facts but is not the business database.
- Correctness-critical exclusion uses database constraints, transactions, or fencing
  tokens; a Redis lease alone is insufficient.

## Why this option

PostgreSQL provides the transactional and RLS guarantees required for project isolation.
Object storage is optimized for large immutable bytes. Redis and brokers scale delivery
and latency but can be rebuilt from authoritative state.

## Alternatives considered

- Redis as authoritative state: rejected because eviction, failover, and persistence
  modes do not match business invariants.
- Event sourcing as the universal source of truth: rejected because it adds replay,
  schema, and operational complexity without a demonstrated requirement.
- Binary data in PostgreSQL: rejected as the default because it couples database backup,
  throughput, and growth to large objects.

## Consequences

Redis loss must degrade performance, not correctness. Broker replay is bounded by
published-event retention and projections. PostgreSQL and object recovery must be
coordinated through reference/checksum verification.

## Validation

Failure tests remove Redis and interrupt broker delivery while authoritative state
remains correct and recoverable.
