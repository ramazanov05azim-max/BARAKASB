# ADR 0012: Limit write transactions to one module owner

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture

## Context

A shared PostgreSQL deployment makes cross-module ACID writes technically easy. Such
transactions create hidden ownership and extraction coupling and become distributed
transactions when either module moves.

## Decision

One transaction may change data and outbox records owned by one module. Workflows
changing multiple owners use a durable process manager, versioned integration events,
idempotent steps, and compensating actions. Synchronous cross-module calls are limited
to public validation or reads that do not acquire write ownership.

## Alternatives considered

- Permit cross-module transactions while co-deployed: rejected because later extraction
  would change consistency and failure semantics.
- Service/database per module immediately: rejected by ADR 0002 and ADR 0009 due to
  unsupported operational cost.

## Consequences

Some platform workflows become eventually consistent and require explicit intermediate
states. Ownership, recovery, and future extraction remain clear.

## Validation

Architecture tests reject repository imports and transaction adapters crossing module
owners. Workflow tests inject failures after each durable step and verify convergence or
compensation.
